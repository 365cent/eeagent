"""Agent sessions, SSE events, deferred patches, memory, and RAG chunks.

Revision ID: 0013_agent_workflow
Revises: 0012_strategy_funnel
"""

from alembic import op


revision = "0013_agent_workflow"
down_revision = "0012_strategy_funnel"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_document_chunk (
            document_id UUID NOT NULL REFERENCES eea_document(id) ON DELETE CASCADE,
            chunk_id INTEGER NOT NULL,
            text TEXT NOT NULL,
            content_sha256 CHAR(64) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (document_id, chunk_id)
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_document_figure (
            document_id UUID NOT NULL REFERENCES eea_document(id) ON DELETE CASCADE,
            figure_index INTEGER NOT NULL,
            caption TEXT,
            review_status TEXT NOT NULL DEFAULT 'ready',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (document_id, figure_index),
            CONSTRAINT ck_document_figure_review CHECK (
                review_status IN ('ready', 'needs_review', 'rejected')
            )
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_agent_session (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            operator_subject TEXT NOT NULL,
            project_key TEXT,
            title TEXT,
            page_context JSONB,
            model_messages_json BYTEA,
            next_event_seq BIGINT NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'active',
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_agent_session_operator ON eea_agent_session (operator_subject, updated_at DESC)"
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_agent_run (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES eea_agent_session(id) ON DELETE CASCADE,
            status TEXT NOT NULL DEFAULT 'running',
            output_json JSONB,
            error_message TEXT,
            cancel_requested BOOLEAN NOT NULL DEFAULT false,
            started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            finished_at TIMESTAMPTZ
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_agent_run_session ON eea_agent_run (session_id, started_at DESC)")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_agent_message (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES eea_agent_session(id) ON DELETE CASCADE,
            run_id UUID REFERENCES eea_agent_run(id) ON DELETE SET NULL,
            role TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_agent_message_role CHECK (role IN ('user', 'assistant'))
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_agent_event (
            session_id UUID NOT NULL REFERENCES eea_agent_session(id) ON DELETE CASCADE,
            seq BIGINT NOT NULL,
            event_type TEXT NOT NULL,
            payload JSONB NOT NULL DEFAULT '{}'::jsonb,
            run_id UUID REFERENCES eea_agent_run(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (session_id, seq)
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_agent_patch (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            session_id UUID NOT NULL REFERENCES eea_agent_session(id) ON DELETE CASCADE,
            run_id UUID REFERENCES eea_agent_run(id) ON DELETE SET NULL,
            signal_id UUID NOT NULL REFERENCES eea_signal(id) ON DELETE CASCADE,
            operator_subject TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            baseline_snapshot JSONB NOT NULL,
            diff JSONB NOT NULL,
            reason TEXT,
            citation_refs JSONB NOT NULL DEFAULT '[]'::jsonb,
            baseline_updated_at TIMESTAMPTZ NOT NULL,
            expires_at TIMESTAMPTZ NOT NULL,
            applied_at TIMESTAMPTZ,
            conflict_reason TEXT,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_agent_patch_status CHECK (
                status IN ('pending', 'applied', 'rejected', 'conflict', 'expired')
            )
        )
        """
    )
    op.execute("CREATE INDEX IF NOT EXISTS ix_agent_patch_session ON eea_agent_patch (session_id, status)")
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS eea_agent_memory (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            operator_subject TEXT NOT NULL,
            project_key TEXT,
            scope TEXT NOT NULL,
            mem_key TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            CONSTRAINT ck_agent_memory_scope CHECK (scope IN ('user', 'project')),
            CONSTRAINT uq_agent_memory UNIQUE (operator_subject, project_key, scope, mem_key)
        )
        """
    )


def downgrade() -> None:
    op.execute("DROP TABLE IF EXISTS eea_agent_memory")
    op.execute("DROP TABLE IF EXISTS eea_agent_patch")
    op.execute("DROP TABLE IF EXISTS eea_agent_event")
    op.execute("DROP TABLE IF EXISTS eea_agent_message")
    op.execute("DROP TABLE IF EXISTS eea_agent_run")
    op.execute("DROP TABLE IF EXISTS eea_agent_session")
    op.execute("DROP TABLE IF EXISTS eea_document_figure")
    op.execute("DROP TABLE IF EXISTS eea_document_chunk")
