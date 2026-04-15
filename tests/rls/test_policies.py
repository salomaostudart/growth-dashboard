"""Testes de RLS policies do Supabase.

Executar manualmente com credenciais de dev Supabase em .env local.
Requisitos: supabase-py + pytest.

TODO: implementar com credenciais de dev reais apos decisao de reativacao.
"""

import os
import pytest


@pytest.mark.skip(reason="Requer credenciais Supabase dev — TODO pos-reativacao")
def test_usuario_nao_auth_nao_le_profiles():
    # Conectar com anon key, tentar SELECT em profiles, deve falhar
    pass


@pytest.mark.skip(reason="Requer credenciais Supabase dev — TODO pos-reativacao")
def test_usuario_auth_le_proprio_profile():
    # Conectar autenticado, SELECT profiles WHERE id = auth.uid(), deve retornar
    pass


@pytest.mark.skip(reason="Requer credenciais Supabase dev — TODO pos-reativacao")
def test_usuario_auth_nao_le_outro_profile():
    # Conectar autenticado, SELECT profiles de outro user, deve falhar ou retornar vazio
    pass


@pytest.mark.skip(reason="Requer credenciais Supabase dev — TODO pos-reativacao")
def test_metric_snapshots_insert_bloqueado_para_auth_comum():
    # Tentar INSERT em metric_snapshots com anon key autenticado,
    # deve falhar (policy corrigida em F1.2)
    pass
