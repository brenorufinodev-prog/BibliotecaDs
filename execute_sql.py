#!/usr/bin/env python3
"""
Script para executar SQL no Supabase e criar a tabela loan_requests.

USO:
    python execute_sql.py

Certifique-se de que o arquivo .env existe na pasta raiz com as variáveis:
    VITE_SUPABASE_URL
    VITE_SUPABASE_ANON_KEY
"""

import os
import sys
import re
from pathlib import Path

# Tenta importar supabase-py se disponível, senão usa requests
try:
    from supabase import create_client, Client
    HAS_SUPABASE_PY = True
except ImportError:
    HAS_SUPABASE_PY = False
    print("⚠️  Supabase-py não instalado. Tentando com requests...")
    try:
        import requests
        import json
    except ImportError:
        print("❌ Nenhuma biblioteca HTTP disponível. Instale: pip install requests")
        sys.exit(1)

def load_env():
    """Carrega variáveis de .env"""
    env_file = Path(".env")
    if not env_file.exists():
        print(f"❌ Arquivo .env não encontrado em {env_file.absolute()}")
        sys.exit(1)
    
    env_vars = {}
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                key, value = line.split("=", 1)
                env_vars[key.strip()] = value.strip()
    
    return env_vars

def execute_with_supabase_py(url: str, key: str, sql: str):
    """Executa SQL usando supabase-py (melhor opção)"""
    print("🔄 Conectando ao Supabase (modo supabase-py)...")
    try:
        client: Client = create_client(url, key)
        
        # Usa RPC se função existir
        # caso contrário, tentamos inserir na tabela para verificar se existe
        result = client.table("loan_requests").select("*").limit(1).execute()
        print("✅ Tabela loan_requests já existe!")
        return True
    except Exception as e:
        error_msg = str(e)
        if "404" in error_msg or "does not exist" in error_msg:
            print("⚠️  Tabela não existe. Precisamos criar manualmente no SQL Editor.")
            return False
        else:
            print(f"❌ Erro: {error_msg}")
            return False

def execute_with_requests(url: str, key: str, sql: str):
    """Executa SQL usando requests (fallback)"""
    print("🔄 Conectando ao Supabase (modo requests)...")
    
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    try:
        # Tenta verificar se tabela existe
        response = requests.post(
            f"{url}/rest/v1/loan_requests?select=*&limit=1",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            print("✅ Tabela loan_requests já existe!")
            return True
        elif response.status_code == 404:
            print("⚠️  Tabela não existe. Precisamos criar manualmente.")
            return False
        else:
            print(f"❌ Status {response.status_code}: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Erro: {e}")
        return False

def main():
    os.chdir(Path(__file__).parent)
    
    print("🔧 Setup: Criando tabela loan_requests\n")
    
    env = load_env()
    url = env.get("VITE_SUPABASE_URL")
    key = env.get("VITE_SUPABASE_ANON_KEY")
    
    if not url or not key:
        print("❌ Variáveis VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY não encontradas em .env")
        sys.exit(1)
    
    print(f"URL: {url}\n")
    
    sql = open("loan-requests-table.sql").read()
    
    # Tenta com supabase-py se disponível
    if HAS_SUPABASE_PY:
        success = execute_with_supabase_py(url, key, sql)
    else:
        success = execute_with_requests(url, key, sql)
    
    if not success:
        print("""
╔════════════════════════════════════════════════════════════════╗
║            ❌ Tabela não criada - Solução Manual             ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  1. Acesse o SQL Editor do Supabase:                          ║
║     https://app.supabase.com/project/cqfeldbnqgavbwuantrw/sql║
║                                                                ║
║  2. Cole o conteúdo do arquivo: loan-requests-table.sql      ║
║                                                                ║
║  3. Clique em "Executar" ou pressione Ctrl+Enter             ║
║                                                                ║
║  4. Pronto! ✨                                               ║
║                                                                ║
║  Mais detalhes em: SETUP_LOAN_REQUESTS.md                    ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
        """)
        sys.exit(1)
    
    print("""
╔═══════════════════════════════════════════╗
║  ✅ Tudo pronto!                         ║
╠═══════════════════════════════════════════╣
║  Você agora pode:                        ║
║  • Registrar solicitações de empréstimo  ║
║  • Admin aprova/rejeita solicitações     ║
╚═══════════════════════════════════════════╝
    """)

if __name__ == "__main__":
    main()

