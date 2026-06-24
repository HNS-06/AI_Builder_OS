-- AI Builder OS Database Schema
-- Run this in Supabase SQL Editor or via migration

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    idea        text NOT NULL,
    domain      text DEFAULT '',
    status      text DEFAULT 'processing' CHECK (status IN ('processing', 'done', 'error')),
    created_at  timestamptz DEFAULT now()
);

-- Agent outputs table
CREATE TABLE IF NOT EXISTS agent_outputs (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id   uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
    agent_name   text NOT NULL CHECK (agent_name IN ('founder', 'pm', 'uiux', 'marketing', 'investor')),
    status       text DEFAULT 'waiting' CHECK (status IN ('waiting', 'running', 'done', 'error')),
    output       text DEFAULT '',
    completed_at timestamptz,
    UNIQUE(project_id, agent_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(user_id, status);
CREATE INDEX IF NOT EXISTS idx_agent_outputs_project ON agent_outputs(project_id);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_outputs ENABLE ROW LEVEL SECURITY;

-- Projects: users can only see their own
CREATE POLICY "Users can view own projects"
    ON projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON projects FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON projects FOR DELETE
    USING (auth.uid() = user_id);

-- Agent outputs: users can only see outputs for their own projects
CREATE POLICY "Users can view own agent outputs"
    ON agent_outputs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = agent_outputs.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own agent outputs"
    ON agent_outputs FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = agent_outputs.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own agent outputs"
    ON agent_outputs FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = agent_outputs.project_id
            AND projects.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own agent outputs"
    ON agent_outputs FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM projects
            WHERE projects.id = agent_outputs.project_id
            AND projects.user_id = auth.uid()
        )
    );

-- Service role bypass (for backend API using service_role_key)
CREATE POLICY "Service role full access projects"
    ON projects FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Service role full access agent_outputs"
    ON agent_outputs FOR ALL
    USING (true)
    WITH CHECK (true);
