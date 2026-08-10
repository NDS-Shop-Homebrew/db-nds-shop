@echo off
REM -------------------------------
REM 1️⃣ Charge les variables depuis server.env
REM -------------------------------
for /f "tokens=1* delims==" %%A in (server.env) do (
    set %%A=%%B
)

REM -------------------------------
REM 2️⃣ Active la virtualenv
REM -------------------------------
call .\.venv\Scripts\activate.bat

REM -------------------------------
REM 3️⃣ Se place dans le dossier source
REM -------------------------------
cd source

REM -------------------------------
REM 4️⃣ Met à jour pip et installe les dépendances
REM -------------------------------
python -m pip install -r requirements.txt

REM -------------------------------
REM 5️⃣ Lance le script pour générer l'unistore
REM -------------------------------
python .\generate.py

REM -------------------------------
REM 5️⃣1️⃣ Lance le script pour générer le games.json sur le site web
REM -------------------------------
python .\generate_games.py

REM -------------------------------
REM 6️⃣ Revenir à la racine du projet
REM -------------------------------
cd ..

REM -------------------------------
REM 7️⃣ Envoie les fichiers sur le serveur
REM -------------------------------
for %%F in (%LOCAL_FOLDERS%) do (
    echo Transfert de %%F vers %SERVER_USER%@%SERVER_HOST%:%REMOTE_PATH%
    scp -i "%USERPROFILE%\.ssh\db-nds-shop_key" -r "%%F" %SERVER_USER%@%SERVER_HOST%:%REMOTE_PATH%
)

REM -------------------------------
REM 8️⃣ Pause pour voir les messages
REM -------------------------------
pause