import cloudinary
import cloudinary.uploader
import os

cloudinary.config(
    cloud_name=os.environ["CLOUDINARY_CLOUD"],
    api_key=os.environ["CLOUDINARY_KEY"],
    api_secret=os.environ["CLOUDINARY_SECRET"],
)

BASE = r"C:\Users\Admin\Downloads\emotions"
FOLDER = "immersio/scenarios/ordering_coffee"

covers = {
    "idle": os.path.join(BASE, "Idle.gif"),
    "happy": os.path.join(BASE, "Thumb-Up.gif"),
    "angry": os.path.join(BASE, "Angry.gif"),
}

links = {}
for emotion, path in covers.items():
    r = cloudinary.uploader.upload(
        path,
        folder=FOLDER,
        public_id=f"ordering_coffee_character_{emotion}",
        overwrite=True,
        resource_type="image",
    )
    links[emotion] = r["secure_url"]
    print(f"{emotion}: {r['secure_url']}")

print("\n--- emotionsJson ---")
import json
print(json.dumps(links))
