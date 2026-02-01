@echo off
setlocal enabledelayedexpansion

REM Baca file
for /f "delims=" %%A in ('type data\questions.json') do (
    set "line=%%A"
    set "line=!line:"category": "PPU"="category": "Pengetahuan & Pemahaman Umum"!"
    set "line=!line:"category": "PBM"="category": "Pemahaman Bacaan & Menulis"!"
    set "line=!line:"category": "PK"="category": "Pengetahuan Kuantitatif"!"
    set "line=!line:"category": "LB-INDO"="category": "Literasi Bahasa Indonesia"!"
    set "line=!line:"category": "LB-ING"="category": "Literasi Bahasa Inggris"!"
    set "line=!line:"category": "PM"="category": "Penalaran Matematika"!"
    echo !line!
) > data\questions_new.json

REM Ganti file lama dengan file baru
move /Y data\questions_new.json data\questions.json

echo Refactor selesai!
