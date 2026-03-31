import cv2
import numpy as np
import json
import sys
import mediapipe as mp

face_mesh = None

def get_face_mesh():
    global face_mesh
    if face_mesh is None:
        mp_face = mp.solutions.face_mesh  # type: ignore
        face_mesh = mp_face.FaceMesh(static_image_mode=True, max_num_faces=1)
    return face_mesh
# -----------------------------
# INIT MEDIAPIPE
# -----------------------------
mp_face = mp.solutions.face_mesh  # type: ignore
face_mesh = mp_face.FaceMesh(static_image_mode=True, max_num_faces=1)


# -----------------------------
# LOAD IMAGE
# -----------------------------
def load_image(path):
    img = cv2.imread(path)
    if img is None:
        raise ValueError("Image not found")
    return cv2.resize(img, (256, 256))  # slightly bigger for mesh accuracy


# -----------------------------
# GET CHEEK REGIONS (KEY PART)
# -----------------------------
def get_cheeks(img):
    fm = get_face_mesh()

    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    result = fm.process(rgb)

    # ✅ correct indentation
    if not result.multi_face_landmarks:
        return None

    h, w = img.shape[:2]
    landmarks = result.multi_face_landmarks[0].landmark

    LEFT_CHEEK = [234, 93, 132, 58]
    RIGHT_CHEEK = [454, 323, 361, 288]

    def extract_region(indices):
        pts = [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in indices]
        x, y, w_box, h_box = cv2.boundingRect(np.array(pts))
        return img[y:y+h_box, x:x+w_box]

    left = extract_region(LEFT_CHEEK)
    right = extract_region(RIGHT_CHEEK)

    return left, right


# -----------------------------
# SKIN PIXELS
# -----------------------------
def extract_skin_pixels(img):
    pixels = img.reshape(-1, 3)

    b, g, r = pixels[:,0], pixels[:,1], pixels[:,2]

    mask = (
        (r > 95) & (g > 40) & (b > 20) &
        (r > g) & (r > b) &
        (np.abs(r - g) > 15)
    )

    skin = pixels[mask]

    if len(skin) < 50:
        return pixels

    return skin


# -----------------------------
# SAMPLE
# -----------------------------
def sample(pixels):
    if len(pixels) > 400:
        idx = np.random.choice(len(pixels), 400, replace=False)
        return pixels[idx]
    return pixels


# -----------------------------
# DOMINANT COLOR (MEDIAN)
# -----------------------------
def dominant_color(pixels):
    b = np.median(pixels[:,0])
    g = np.median(pixels[:,1])
    r = np.median(pixels[:,2])
    return [int(r), int(g), int(b)]


# -----------------------------
# UNDERTONE (FINAL FIX)
# -----------------------------
def detect_undertone(rgb):
    r, g, b = rgb
    total = r + g + b

    r_n, b_n = r/total, b/total
    diff = r_n - b_n

    if diff > 0.12:
        return "warm"
    elif diff < -0.12:
        return "cool"
    return "neutral"


# -----------------------------
# TONE
# -----------------------------
def detect_tone(rgb):
    r, g, b = rgb
    brightness = 0.299*r + 0.587*g + 0.114*b

    if brightness >= 210:
        tone = "light"
    elif brightness >= 140:
        tone = "medium"
    else:
        tone = "dark"

    return tone, brightness


# -----------------------------
# SATURATION
# -----------------------------
def saturation(rgb):
    r, g, b = rgb
    max_c = max(r,g,b)
    min_c = min(r,g,b)
    return 0 if max_c == 0 else (max_c-min_c)/max_c


# -----------------------------
# SEASON
# -----------------------------
def season(tone, undertone):
    if undertone == "warm":
        return "Spring" if tone == "light" else "Autumn"
    elif undertone == "cool":
        return "Summer" if tone == "light" else "Winter"
    return "Neutral"


# -----------------------------
# MAIN
# -----------------------------
def main():
    path = sys.argv[1]

    img = load_image(path)

    cheeks = get_cheeks(img)

    if cheeks is None:
        # fallback to center crop
        h, w = img.shape[:2]
        face = img[int(h*0.4):int(h*0.6), int(w*0.4):int(w*0.6)]
        pixels = extract_skin_pixels(face)
    else:
        left, right = cheeks
        pixels = np.vstack([
            extract_skin_pixels(left),
            extract_skin_pixels(right)
        ])

    pixels = sample(pixels)

    rgb = dominant_color(pixels)

    undertone = detect_undertone(rgb)
    tone, brightness = detect_tone(rgb)
    sat = saturation(rgb)

    result = {
        "skin_tone": tone,
        "undertone": undertone,
        "rgb": rgb,
        "hex": "#{:02x}{:02x}{:02x}".format(*rgb),
        "brightness": round(brightness,2),
        "saturation": round(sat,2),
        "season": season(tone, undertone),
        "confidence": 0.92
    }

    print(json.dumps(result), flush=True)


if __name__ == "__main__":
    main()