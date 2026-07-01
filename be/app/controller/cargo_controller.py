from fastapi import APIRouter

router = APIRouter(
    prefix="/cargo",
    tags=["Cargo"],
)


@router.get("/")
def root():
    return {"message": "Cargo Tracker API"}
