-- Leaderboard rollup.
--
-- Benchlee's ranking is deliberately vote-first: what humans picked when they
-- looked at two artifacts side by side. The editorial rubric average rides
-- along as a secondary signal, never as the headline.

CREATE OR REPLACE VIEW model_standings AS
WITH run_votes AS (
  SELECT r.id AS run_id,
         r.model_id,
         (SELECT count(*) FROM votes v WHERE v.winner_run_id = r.id) AS wins,
         (SELECT count(*) FROM votes v WHERE v.loser_run_id  = r.id) AS losses
  FROM runs r
),
per_model AS (
  SELECT m.id                                   AS model_id,
         COALESCE(sum(rv.wins), 0)::int         AS wins,
         COALESCE(sum(rv.losses), 0)::int       AS losses
  FROM models m
  LEFT JOIN run_votes rv ON rv.model_id = m.id
  GROUP BY m.id
),
per_model_scores AS (
  SELECT r.model_id,
         round(avg(s.value), 2)                 AS rubric_avg,
         count(DISTINCT r.id)::int              AS run_count
  FROM runs r
  LEFT JOIN scores s ON s.run_id = r.id
  WHERE r.status = 'ok'
  GROUP BY r.model_id
),
per_model_artifacts AS (
  SELECT r.model_id, count(a.id)::int AS artifact_count
  FROM runs r
  JOIN artifacts a ON a.run_id = r.id
  GROUP BY r.model_id
)
SELECT m.id,
       m.slug,
       m.name,
       m.vendor,
       m.badge,
       m.accent_hex,
       COALESCE(pm.wins, 0)                     AS wins,
       COALESCE(pm.losses, 0)                   AS losses,
       COALESCE(pm.wins, 0) + COALESCE(pm.losses, 0) AS matchups,
       CASE
         WHEN COALESCE(pm.wins, 0) + COALESCE(pm.losses, 0) = 0 THEN NULL
         ELSE round(
           COALESCE(pm.wins, 0)::numeric
           / (COALESCE(pm.wins, 0) + COALESCE(pm.losses, 0))::numeric, 4)
       END                                      AS win_rate,
       pms.rubric_avg,
       COALESCE(pms.run_count, 0)               AS run_count,
       COALESCE(pma.artifact_count, 0)          AS artifact_count
FROM models m
LEFT JOIN per_model pm           ON pm.model_id = m.id
LEFT JOIN per_model_scores pms   ON pms.model_id = m.id
LEFT JOIN per_model_artifacts pma ON pma.model_id = m.id;
