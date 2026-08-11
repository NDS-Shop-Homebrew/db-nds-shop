@echo off
REM ============================================================
REM  db-nds-shop — build complet + deploiement
REM
REM  Enchaine le pipeline entier :
REM    1. Icônes + boxart + screenshots (nds-assets.mjs, via node)
REM    2. Frontmatter _ds/*.md (image_length + URLs snaps)
REM    3. games.json du site (generate_games.py)
REM    4. Pages _ds, QR, unistore app 3DS (generate.py)
REM    5. Forwarders .cia (nds-to-cia.mjs, optionnel, necessite les ROMs)
REM    6. Deploiement rsync (incremental) vers le serveur
REM
REM  Pre-requis : .venv (python) + node >= 18 + ROMs dans %NDS_ROMS%
REM ============================================================
setlocal

REM ------------------------------------------------------------
REM 1. Charge les variables depuis server.env
REM    (SERVER_USER, SERVER_HOST, REMOTE_PATH, LOCAL_FOLDERS, NDS_ROMS)
REM ------------------------------------------------------------
for /f "tokens=1* delims==" %%A in (server.env) do (
    set %%A=%%B
)

REM ------------------------------------------------------------
REM 2. Active la virtualenv python
REM ------------------------------------------------------------
call .\.venv\Scripts\activate.bat
if errorlevel 1 (
    echo [ERREUR] virtualenv introuvable - creez-la avec: python -m venv .venv
    goto :fin
)

REM ------------------------------------------------------------
REM 3. Dependances python
REM ------------------------------------------------------------
python -m pip install -r source\requirements.txt

REM ------------------------------------------------------------
REM 4. Assets : icones (ROMs) + boxart + screenshots (libretro)
REM ------------------------------------------------------------
if defined NDS_ROMS (
    node tools\nds-to-cia\nds-assets.mjs --apps source\apps --roms "%NDS_ROMS%" --out frontend\public
) else (
    echo [AVERTISSEMENT] NDS_ROMS absent de server.env - icones non extraites, boxart/screenshots seuls
    node tools\nds-to-cia\nds-assets.mjs --apps source\apps --out frontend\public --no-icons
)

REM ------------------------------------------------------------
REM 5. Pages _ds + QR + unistore (app 3DS)
REM    generate.py doit tourner AVANT update_md (il regenere les md)
REM ------------------------------------------------------------
cd source
python .\generate.py
if errorlevel 1 goto :fin
cd ..

REM ------------------------------------------------------------
REM 6. Frontmatter _ds + games.json
REM    (remplace les URLs Boxart par les vraies snaps libretro)
REM ------------------------------------------------------------
python tools\nds-to-cia\update_md_screenshots.py
if errorlevel 1 goto :fin

cd source
python .\generate_games.py
if errorlevel 1 goto :fin
cd ..

REM ------------------------------------------------------------
REM 7. Forwarders .cia (optionnel)
REM    (commenter la ligne si la compilation n'est pas necessaire)
REM ------------------------------------------------------------
REM if defined NDS_ROMS (
REM     node tools\nds-to-cia\nds-to-cia.mjs --roms "%NDS_ROMS%" --from-apps source\apps --out frontend\public\forwarder
REM )

REM ------------------------------------------------------------
REM 8. Deploiement rsync incremental (fallback scp si absent)
REM ------------------------------------------------------------
if not defined SERVER_HOST goto :fin
where rsync >nul 2>&1
if errorlevel 1 (
    echo [INFO] rsync absent - utilisation de scp (copie complete)
    for %%F in (%LOCAL_FOLDERS:;= %) do (
        echo Transfert de %%F vers %SERVER_USER%@%SERVER_HOST%:%REMOTE_PATH%
        scp -i "%USERPROFILE%\.ssh\db-nds-shop_key" -r "%%F" %SERVER_USER%@%SERVER_HOST%:%REMOTE_PATH%
    )
) else (
    for %%F in (%LOCAL_FOLDERS:;= %) do (
        echo Transfert de %%F vers %SERVER_USER%@%SERVER_HOST%:%REMOTE_PATH%
        rsync -az -e "ssh -i ""%USERPROFILE%\.ssh\db-nds-shop_key""" "%%F" %SERVER_USER%@%SERVER_HOST%:%REMOTE_PATH%
    )
)

echo.
echo ✅ Build termine.
:fin
endlocal
pause
