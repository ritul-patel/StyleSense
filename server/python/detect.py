import json
import math
import os
import sys
import time

import cv2
import numpy as np

MAX_EDGE = 640

# Fitzpatrick classification by ITA° (Individual Typology Angle)
FITZPATRICK_BANDS = [
    (55,   float("inf"),  "I",   "Very pale; always burns, never tans."),
    (41,   55,            "II",  "Fair; usually burns, tans minimally."),
    (28,   41,            "III", "Light brown/beige; burns sometimes, tans gradually."),
    (10,   28,            "IV",  "Olive/Moderate brown; rarely burns, tans easily."),
    (-30,  10,            "V",   "Dark brown; very rarely burns, tans deeply."),
    (float("-inf"), -30,  "VI",  "Deepest brown/Black; never burns, tans very easily."),
]

# YCrCb skin range — covers all Fitzpatrick types
SKIN_YCRB_LOWER = np.array([0,  133, 77],  dtype=np.uint8)
SKIN_YCRB_UPPER = np.array([255, 173, 127], dtype=np.uint8)

# Load OpenCV Haar cascade
# Strategy: try cv2.data.haarcascades (works when opencv ships data files),
# then fall back to bundled XML in same directory as this script.
def _load_cascade():
    """Load face cascade with fallback to bundled XML."""
    # Try 1: OpenCV's built-in data directory
    try:
        cv2_path = cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        if os.path.isfile(cv2_path):
            cc = cv2.CascadeClassifier(cv2_path)
            if not cc.empty():
                return cc
    except (AttributeError, Exception):
        pass  # cv2.data may not exist in some builds

    # Try 2: Bundled XML relative to this script
    script_dir = os.path.dirname(os.path.abspath(__file__))
    bundled_path = os.path.join(script_dir, "haarcascade_frontalface_default.xml")
    if os.path.isfile(bundled_path):
        cc = cv2.CascadeClassifier(bundled_path)
        if not cc.empty():
            return cc

    # Try 3: Common Linux system paths
    for sys_path in [
        "/usr/share/opencv4/haarcascades/haarcascade_frontalface_default.xml",
        "/usr/local/share/opencv4/haarcascades/haarcascade_frontalface_default.xml",
    ]:
        if os.path.isfile(sys_path):
            cc = cv2.CascadeClassifier(sys_path)
            if not cc.empty():
                return cc

    return None

face_cascade = _load_cascade()


def emit_json(payload):
    sys.stdout.write(json.dumps(payload, separators=(",", ":")))
    sys.stdout.flush()


def fail(message, code="ANALYSIS_ERROR", detail=None, exit_code=1):
    emit_json({"success": False, "error": {"code": code, "message": message, "detail": detail}})
    raise SystemExit(exit_code)


def load_image(path):
    img = cv2.imread(path)
    if img is None:
        raise ValueError("Image not found or unreadable.")
    h, w = img.shape[:2]
    if max(h, w) > MAX_EDGE:
        scale = MAX_EDGE / max(h, w)
        img = cv2.resize(img, (int(w * scale), int(h * scale)), interpolation=cv2.INTER_AREA)
    return img


def grey_world_white_balance(img):
    result = img.copy().astype(np.float32)
    avg_b = np.mean(result[:, :, 0])
    avg_g = np.mean(result[:, :, 1])
    avg_r = np.mean(result[:, :, 2])
    avg_all = (avg_b + avg_g + avg_r) / 3.0
    if avg_b > 0: result[:, :, 0] = np.clip(result[:, :, 0] * (avg_all / avg_b), 0, 255)
    if avg_g > 0: result[:, :, 1] = np.clip(result[:, :, 1] * (avg_all / avg_g), 0, 255)
    if avg_r > 0: result[:, :, 2] = np.clip(result[:, :, 2] * (avg_all / avg_r), 0, 255)
    return result.astype(np.uint8)


def detect_face(img):
    """Returns (x, y, w, h) of largest face, or None."""
    if face_cascade is None or face_cascade.empty():
        return None  # Cascade not available — skip face detection, use center fallback
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4, minSize=(60, 60))
    if len(faces) == 0:
        return None
    # Pick largest face
    return max(faces, key=lambda f: f[2] * f[3])


def get_face_regions(img, face):
    """
    Return 4 BGR patch arrays from face bounding box:
    left_cheek, right_cheek, forehead, chin.
    Positions as fractions of the face bbox.
    """
    fx, fy, fw, fh = face
    ih, iw = img.shape[:2]

    def crop(x0f, y0f, x1f, y1f):
        x0 = max(0, int(fx + fw * x0f))
        y0 = max(0, int(fy + fh * y0f))
        x1 = min(iw, int(fx + fw * x1f))
        y1 = min(ih, int(fy + fh * y1f))
        if x1 <= x0 or y1 <= y0:
            return None
        return img[y0:y1, x0:x1]

    return [
        crop(0.05, 0.45, 0.35, 0.75),  # left cheek
        crop(0.65, 0.45, 0.95, 0.75),  # right cheek
        crop(0.25, 0.05, 0.75, 0.30),  # forehead
        crop(0.30, 0.75, 0.70, 0.95),  # chin
    ]


def skin_pixels(region):
    ycrb = cv2.cvtColor(region, cv2.COLOR_BGR2YCrCb)
    mask = cv2.inRange(ycrb, SKIN_YCRB_LOWER, SKIN_YCRB_UPPER)
    mask = cv2.medianBlur(mask, 3)
    px = region[mask > 0]
    return px if len(px) >= 20 else region.reshape(-1, 3)


def bgr_to_lab(bgr):
    arr = np.array([[bgr]], dtype=np.uint8)
    lab = cv2.cvtColor(arr, cv2.COLOR_BGR2LAB)[0][0]
    L     = float(lab[0]) / 2.55
    a_val = float(lab[1]) - 128.0
    b_val = float(lab[2]) - 128.0
    return L, a_val, b_val


def compute_ita(L, b_val):
    if abs(b_val) < 1e-6:
        b_val = 1e-6
    return math.atan2(L - 50.0, b_val) * (180.0 / math.pi)


def fitzpatrick_from_ita(ita):
    for low, high, ftype, desc in FITZPATRICK_BANDS:
        if low <= ita < high:
            return ftype, desc
    return "VI", FITZPATRICK_BANDS[-1][3]


def detect_undertone(a_val, b_val):
    if b_val > 8 and b_val > abs(a_val) * 1.2:
        return "warm"
    if a_val > 6 and a_val > b_val * 0.8:
        return "cool"
    return "neutral"


def delta_e(lab1, lab2):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(lab1, lab2)))


def main():
    started = time.time()

    if len(sys.argv) < 2:
        fail("Image path argument is required.", code="INVALID_ARGUMENT")

    try:
        raw = load_image(sys.argv[1])
        img = grey_world_white_balance(raw)

        face = detect_face(img)
        face_detected = face is not None

        region_labs = []
        region_bgrs = []

        if face_detected:
            patches = get_face_regions(img, face)
            for patch in patches:
                if patch is None or patch.size == 0:
                    continue
                px = skin_pixels(patch)
                bgr = np.median(px, axis=0).astype(np.uint8)
                L, a, b = bgr_to_lab(bgr)
                region_labs.append((L, a, b))
                region_bgrs.append(bgr)

        # Fallback: center crop
        if not region_labs:
            h, w = img.shape[:2]
            center = img[int(h * 0.3):int(h * 0.6), int(w * 0.3):int(w * 0.7)]
            px = skin_pixels(center)
            bgr = np.median(px, axis=0).astype(np.uint8)
            L, a, b = bgr_to_lab(bgr)
            region_labs.append((L, a, b))
            region_bgrs.append(bgr)

        L_final = float(np.median([l[0] for l in region_labs]))
        a_final = float(np.median([l[1] for l in region_labs]))
        b_final = float(np.median([l[2] for l in region_labs]))

        final_bgr = np.median(np.array(region_bgrs), axis=0).astype(np.uint8)
        rgb = [int(final_bgr[2]), int(final_bgr[1]), int(final_bgr[0])]

        ita = compute_ita(L_final, b_final)
        fitz_type, fitz_desc = fitzpatrick_from_ita(ita)
        undertone = detect_undertone(a_final, b_final)

        max_delta = 0.0
        if len(region_labs) >= 2:
            max_delta = max(
                delta_e(region_labs[i], region_labs[j])
                for i in range(len(region_labs))
                for j in range(i + 1, len(region_labs))
            )

        # Confidence
        if face_detected and len(region_labs) >= 3:
            conf = 0.90
        elif face_detected and len(region_labs) >= 2:
            conf = 0.80
        elif face_detected:
            conf = 0.65
        else:
            conf = 0.40
        if max_delta > 20: conf -= 0.20
        elif max_delta > 10: conf -= 0.10
        conf = round(max(0.1, min(1.0, conf)), 2)

        emit_json({
            "success": True,
            "data": {
                "fitzpatrick_type": fitz_type,
                "fitzpatrick_desc": fitz_desc,
                "undertone": undertone,
                "rgb": rgb,
                "hex": "#{:02x}{:02x}{:02x}".format(*rgb),
                "ita_angle": round(ita, 2),
                "L_star": round(L_final, 2),
                "a_star": round(a_final, 2),
                "b_star": round(b_final, 2),
                "regions_sampled": len(region_labs),
                "face_detected": face_detected,
                "region_delta_e": round(max_delta, 2),
                "confidence": conf,
                "elapsed_ms": round((time.time() - started) * 1000, 2),
            },
        })

    except SystemExit:
        raise
    except Exception as exc:
        fail("Python detection failed.", code="PYTHON_RUNTIME_ERROR", detail=str(exc))


if __name__ == "__main__":
    main()
