from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import oracledb, os
oracledb.init_oracle_client(lib_dir="/home/azureuser/oracle/instantclient_19_21")
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
        raise HTTPException(status_code=500, detail=str(e))

