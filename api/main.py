from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import oracledb, os
oracledb.init_oracle_client()
app = FastAPI()
dsn_oracle = oracledb.makedsn("127.0.0.1", 1521, sid="xe")


class UserRegistration(BaseModel):
    username: str
    password: str = Field(..., min_length=6)

@app.post("/register")
def register(user: UserRegistration):
    try:
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

        # [ERROR MESSAGE] Account already exists
        if "ORA-00001" in error_string:
            raise HTTPException(status_code=400, detail="This username is already taken!")
        # [ERROR MESSAGE] default
        raise HTTPException(status_code=500, detail="An internal server error occured!")

class UserLogin(BaseModel):
    username: str
    password: str

@app.post("/login")
def login(user: UserLogin):
    try:
        connection = oracledb.connect(
            user="citadel",
            password=os.getenv("DB_PASSWORD"),
            dsn=dsn_oracle
        )

        cursor = connection.cursor()

        cursor.execute(
            "SELECT USERNAME, STATUS FROM accounts " \
            "WHERE USERNAME = :username AND PASSWD = :password",
            {"username": user.username, "password": user.password}
        )
        row = cursor.fetchone()

        cursor.close()
        connection.close()

        if not row:
            raise HTTPException(status_code=400, detail="Password incorrect or username not found!")

        return {
            "message": "Logged in successfully!",
            "userData": {
                "username": row[0],
                "status": row[1]
            }
        }
    except HTTPException as he:
        raise he
    except Exception as e:
        raise HTTPException(status_code=500, detail="An internal server error occurred!")
