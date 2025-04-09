from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, firestore
from typing import Optional, List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
cred = credentials.Certificate({
    "type": "service_account",
    "project_id": os.getenv('FIREBASE_PROJECT_ID'),
    "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
    "private_key": os.getenv('FIREBASE_PRIVATE_KEY').replace('\\n', '\n'),
    "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
    "client_id": os.getenv('FIREBASE_CLIENT_ID'),
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": os.getenv('FIREBASE_CLIENT_X509_CERT_URL'),
    "universe_domain": "googleapis.com"
})

firebase_admin.initialize_app(cred)
db = firestore.client()

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class Asset(BaseModel):
    name: str
    type: str
    description: Optional[str] = None
    status: str
    pricePerDay: float
    currency: str

class Booking(BaseModel):
    assetId: str
    date: datetime
    description: Optional[str] = None
    bookedBy: str
    numberOfPeople: Optional[int] = None
    customPrice: Optional[float] = None
    currency: str

# Asset endpoints
@app.get("/api/assets")
async def get_assets():
    try:
        assets_ref = db.collection('assets')
        docs = assets_ref.stream()
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/assets")
async def create_asset(asset: Asset):
    try:
        doc_ref = db.collection('assets').document()
        asset_data = {
            **asset.dict(),
            "createdAt": firestore.SERVER_TIMESTAMP,
            "updatedAt": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(asset_data)
        return {"id": doc_ref.id, **asset_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Booking endpoints
@app.get("/api/bookings/{user_id}")
async def get_user_bookings(user_id: str):
    try:
        bookings_ref = db.collection('bookings').where('bookedBy', '==', user_id)
        docs = bookings_ref.stream()
        return [{"id": doc.id, **doc.to_dict()} for doc in docs]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bookings")
async def create_booking(booking: Booking):
    try:
        doc_ref = db.collection('bookings').document()
        booking_data = {
            **booking.dict(),
            "status": "Pending",
            "createdAt": firestore.SERVER_TIMESTAMP
        }
        doc_ref.set(booking_data)
        return {"id": doc_ref.id, **booking_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)