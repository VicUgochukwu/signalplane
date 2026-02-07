=INSERT INTO control_plane.packets (week_start, week_end, packet_title, exec_summary, sections, key_questions, bets, predictions, action_mapping)
VALUES (
  '{{ $json.week_start }}'::date,
  '{{ $json.week_end }}'::date,
  '{{ $json.packet.packet_title.replace(/'/g, "''") }}',
  ARRAY[{{ $json.packet.exec_summary.map(s => "'" + s.replace(/'/g, "''") + "'").join(',') }}]::text[],
  $jsonb${{ JSON.stringify($json.packet.sections) }}$jsonb$::jsonb,
  ARRAY[{{ $json.packet.key_questions.map(q => "'" + q.replace(/'/g, "''") + "'").join(',') }}]::text[],
  $jsonb${{ JSON.stringify($json.packet.bets || []) }}$jsonb$::jsonb,
  $jsonb${{ JSON.stringify($json.packet.predictions || []) }}$jsonb$::jsonb,
  $jsonb${{ JSON.stringify($json.packet.action_mapping || {}) }}$jsonb$::jsonb
)
ON CONFLICT (week_start, week_end) DO UPDATE
SET packet_title = EXCLUDED.packet_title, exec_summary = EXCLUDED.exec_summary, sections = EXCLUDED.sections,
    key_questions = EXCLUDED.key_questions, bets = EXCLUDED.bets, predictions = EXCLUDED.predictions,
    action_mapping = EXCLUDED.action_mapping
RETURNING id;
