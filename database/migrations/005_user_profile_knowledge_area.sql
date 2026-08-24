ALTER TABLE user_profiles
    ADD COLUMN knowledge_area_id uuid REFERENCES knowledge_areas (id);

CREATE INDEX user_profiles_knowledge_area_idx ON user_profiles (knowledge_area_id);
