function csvToTags(csv) {
    if (!csv) return [];
    return csv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
}

function tagsToCsv(tags) {
    if (!tags || !Array.isArray(tags)) return null;
    return tags.join(',');
}

function mapTaskRowToTask(row) {
    if (!row) return null;

    return {
        id: row.id,
        title: row.title,
        description: row.description,
        status: row.status,
        priority: row.priority,
        assignee_id: row.assignee_id,
        assignee_name: row.assignee_name || null,
        category: row.category,
        tags: csvToTags(row.tags),
        due_date: row.due_date,
        start_date: row.start_date,
        end_date: row.end_date,
        estimated_hours: row.estimated_hours,
        actual_hours: row.actual_hours,
        created_by: row.created_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
    };
}

module.exports = {
    mapTaskRowToTask,
    tagsToCsv,
};
