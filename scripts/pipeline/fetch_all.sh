#!/usr/bin/env bash
# Download the five raw datasets into data/raw/ (git-ignored). Then: python -I scripts/pipeline/build_data.py data/raw public/data
# Uses the system curl on Windows (schannel) because Git Bash's curl can't verify ec.europa.eu's certificate.
set -euo pipefail
cd "$(dirname "$0")/../.."
CURL=curl; [ -x /c/Windows/System32/curl.exe ] && CURL=/c/Windows/System32/curl.exe
mkdir -p data/raw/{norway,sweden,eurostat,kaggle}

# 1. Carbonfact open LCA database (impact scores per process)
[ -d data/raw/carbonfact ] || git clone -q --depth 1 https://github.com/carbonfact/lca-database-footwear-apparel data/raw/carbonfact

# 2. Norway post-consumer garments: only the 5 MB data table (the 80 GB of images are not needed)
$CURL -sSL -o data/raw/norway/NPCGA_datatable_1.1.csv "https://zenodo.org/api/records/20440761/files/NPCGA_datatable_1.1.csv/content"
$CURL -sSL -o data/raw/norway/README_for_datatable.pdf "https://zenodo.org/api/records/20440761/files/README_for_datatable.pdf/content"

# 3. Swedish second-hand sorting (Zenodo 12518734 is one 27 GB zip of images + JSON). Range requests read only the
#    ~32,000 JSON annotations (where sorters sent each garment, and at which station); no images are downloaded.
#    (The Hugging Face copy has no station column, so it can't separate the sorting plant from Myrorna's shops.)
python -I scripts/pipeline/fetch_sweden_labels.py data/raw/sweden

# 4. Eurostat env_wasgen: textile wastes (W076), all sectors and countries, tonnes and kg per person
$CURL -sSL -o data/raw/eurostat/env_wasgen_textiles.csv \
  "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/env_wasgen/A.T+KG_HAB.HAZ_NHAZ..W076./?format=SDMX-CSV&compressed=false"

# 5. Kaggle: The Fast Fashion Industry Dataset 2000-2023 (public, no login needed for this endpoint)
$CURL -sSL -o data/raw/kaggle/ff.zip "https://www.kaggle.com/api/v1/datasets/download/harshinigande/the-fast-fashion-industry-dataset-2000-2023"
python -I -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" data/raw/kaggle/ff.zip data/raw/kaggle
echo "raw data ready in data/raw/"
