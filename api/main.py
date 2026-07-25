from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import oracledb, os
oracledb.init_oracle_client()
app = FastAPI()

class UserRegistration(BaseModel):
    username: str
    password: str

@app.post("/register")
def register(user: UserRegistration):
    try:
        dsn_oracle = oracledb.makedsn("127.0.0.1", 1521, sid="xe")

        connection = oracledb.connect(
            user="citadel",
            password=os.getenv("DB_PASSWORD"),
            dsn=dsn_oracle
        )

        cursor = connection.cursor()

        cursor.callproc("create_account", [user.username, user.password])

        connection.commit()
        cursor.close()
        connection.close()

        return {"status": "success"}
    except Exception as e:
        error_string = str(e)

        # account already exists
        if "ORA-00001" in error_string:
            raise HTTPException(status_code=400, detail="This username is already taken!")
        raise HTTPException(status_code=500, detail="An internal server error occured!")

