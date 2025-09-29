import cv2
import os
from datetime import datetime
#from picamera2 import Picamera2
#import time

# Change this to the name of the person you're photographing
PERSON_NAME = "dhanush"  

def create_folder(name):
    dataset_folder = "dataset"
    if not os.path.exists(dataset_folder):
        os.makedirs(dataset_folder)
    
    person_folder = os.path.join(dataset_folder, name)
    if not os.path.exists(person_folder):
        os.makedirs(person_folder)
    return person_folder

def capture_photos(name):
    folder = create_folder(name)
    
    # Initialize the camera
    cap = cv2.VideoCapture(1)
    if not cap.isOpened():
        print("Cannot open camera")
        return  # or exit() if you want to stop the script

    print(f"Taking photos for {name}. Press SPACE to capture, q to quit.")
    photocount = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            print("Cannot receive frame. Exiting ...")
            break
        cv2.imshow("Capture", frame)
        key = cv2.waitKey(1) & 0xFF
        if key == ord(" "):
            timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
            filename = f"{name}_{timestamp}.jpg"
            filepath = os.path.join(folder, filename)
            cv2.imwrite(filepath, frame)
            photocount += 1
            print(f"Photo {photocount} saved: {filepath}")
        elif key == ord("q") or key == ord("Q"):
            break
    cap.release()
    cv2.destroyAllWindows()
    print(f"Photo capture completed. {photocount} photos saved for {name}.")


if __name__ == "__main__":
    capture_photos(PERSON_NAME)
