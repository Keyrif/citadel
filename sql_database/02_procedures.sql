CREATE OR REPLACE PROCEDURE create_account(
    p_username IN VARCHAR,
    p_password IN VARCHAR
) IS

BEGIN
    INSERT INTO accounts (id, username, passwd)
    VALUES (id_number.NEXTVAL, p_username, p_password);
    COMMIT;
END;
/