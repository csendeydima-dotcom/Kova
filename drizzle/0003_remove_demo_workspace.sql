DELETE FROM `tasks`
WHERE `title` IN (
  'Підготувати фінальну презентацію',
  'Експортувати логотипи',
  'Узгодити прототип кабінету'
)
AND `project_id` IN (
  SELECT `id` FROM `projects`
  WHERE `name` IN ('Nord Studio', 'Arka App')
);
--> statement-breakpoint
DELETE FROM `projects`
WHERE `name` IN ('Nord Studio', 'Arka App')
AND `client` IN ('Айдентика бренду', 'Дизайн продукту');
