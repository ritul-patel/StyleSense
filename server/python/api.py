from fastapi import FastAPI, File, HTTPException, UploadFile
from pydantic import BaseModel
import cv2
import numpy as np
import mediapipe as mp

app = FastAPI(title="StyleSense FastAPI Analyzer")

# -----------------------------
# LOAD MEDIAPIPE ONCE (FAST)
# -----------------------------
mp_face = mp.solutions.face_mesh  # type: ignore
face_mesh = mp_face.FaceMesh(
    static_image_mode=True,
    max_num_faces=1,
    refine_landmarks=False,
    min_detection_confidence=0.5
)


# -----------------------------
# HELPERS
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


def sample(pixels):
    if len(pixels) > 400:
        idx = np.random.choice(len(pixels), 400, replace=False)
        return pixels[idx]
    return pixels


def dominant_color(pixels):
    b = np.median(pixels[:,0])
    g = np.median(pixels[:,1])
    r = np.median(pixels[:,2])
    return [int(r), int(g), int(b)]


def detect_undertone(rgb):
    r, g, b = rgb

    total = r + g + b
    if total <= 0:
        return "neutral"

    r_n, g_n, b_n = r/total, g/total, b/total

    diff_rb = r_n - b_n
    diff_rg = r_n - g_n

    # 🔥 balanced logic
    if diff_rb > 0.13 and diff_rg > 0.04:
        return "warm"
    elif diff_rb < -0.12:
        return "cool"
    else:
        return "neutral"


def detect_tone(rgb):
    r, g, b = rgb
    brightness = 0.299*r + 0.587*g + 0.114*b

    if brightness >= 210:
        tone = "light"
    elif brightness >= 170:
        tone = "light-medium"
    elif brightness >= 135:
        tone = "medium"
    elif brightness >= 100:
        tone = "medium-dark"
    else:
        tone = "dark"

    return tone, brightness


def saturation(rgb):
    r, g, b = rgb
    max_c = max(r,g,b)
    min_c = min(r,g,b)
    return 0 if max_c == 0 else (max_c-min_c)/max_c


def season(tone, undertone):
    if undertone == "warm":
        return "Spring" if tone == "light" else "Autumn"
    elif undertone == "cool":
        return "Summer" if tone == "light" else "Winter"
    return "Neutral"


class AnalysisResponse(BaseModel):
    skin_tone: str
    undertone: str
    rgb: list[int]
    hex: str
    brightness: float
    saturation: float
    season: str
    confidence: float


# -----------------------------
# CHEEK EXTRACTION (FACE MESH)
# -----------------------------
def get_cheeks(img):
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    result = face_mesh.process(rgb)

    if not result.multi_face_landmarks:
        return None

    h, w = img.shape[:2]
    landmarks = result.multi_face_landmarks[0].landmark

    LEFT = [234, 93, 132, 58]
    RIGHT = [454, 323, 361, 288]

    def extract(indices):
        pts = [(int(landmarks[i].x * w), int(landmarks[i].y * h)) for i in indices]
        x, y, w_box, h_box = cv2.boundingRect(np.array(pts))
        return img[y:y+h_box, x:x+w_box]

    return extract(LEFT), extract(RIGHT)


# -----------------------------
# API
# -----------------------------
@app.post("/analyze", response_model=AnalysisResponse)
async def analyze(file: UploadFile = File(...)):
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Only image uploads are supported.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty upload received.")

    npimg = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(npimg, cv2.IMREAD_COLOR)

    if img is None:
        raise HTTPException(status_code=400, detail="Could not decode image.")

    img = cv2.resize(img, (256, 256))

    cheeks = get_cheeks(img)

    if cheeks is None:
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

    return AnalysisResponse(
        skin_tone=tone,
        undertone=undertone,
        rgb=rgb,
        hex="#{:02x}{:02x}{:02x}".format(*rgb),
        brightness=round(brightness, 2),
        saturation=round(sat, 2),
        season=season(tone, undertone),
        confidence=0.92,
    )
