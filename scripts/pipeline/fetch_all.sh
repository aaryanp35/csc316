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

# 3. Swedish second-hand sorting (Zenodo 12518734 is one 27 GB zip of images + JSON). The authors' Hugging Face copy
#    exposes exact label frequencies for every item, which is all the story needs.
for split in train test; do
  $CURL -sSL -o "data/raw/sweden/hf_statistics_$split.json" \
    "https://datasets-server.huggingface.co/statistics?dataset=fnauman/fashion-second-hand-front-only-rgb&config=default&split=$split"
done

# 4. Eurostat env_wasgen: textile wastes (W076), all sectors and countries, tonnes and kg per person
$CURL -sSL -o data/raw/eurostat/env_wasgen_textiles.csv \
  "https://ec.europa.eu/eurostat/api/dissemination/sdmx/2.1/data/env_wasgen/A.T+KG_HAB.HAZ_NHAZ..W076./?format=SDMX-CSV&compressed=false"

# 5. Kaggle: The Fast Fashion Industry Dataset 2000-2023 (public, no login needed for this endpoint)
$CURL -sSL -o data/raw/kaggle/ff.zip "https://www.kaggle.com/api/v1/datasets/download/harshinigande/the-fast-fashion-industry-dataset-2000-2023"
python -I -c "import zipfile,sys; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])" data/raw/kaggle/ff.zip data/raw/kaggle
echo "raw data ready in data/raw/"
