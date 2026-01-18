const { z } = require('zod');

const taskBase = z.object({
    body: z.object({
        title: z.string().min(1, 'title is required'),
        description: z.string().nullable().optional(),
        status: z.string().optional(),
        priority: z.string().optional(),
        assignee_id: z.number().nullable().optional(),
        category: z.string().nullable().optional(),
        tags: z.array(z.string()).optional(),
        due_date: z.string().nullable().optional(),
        start_date: z.string().nullable().optional(),
        end_date: z.string().nullable().optional(),
        estimated_hours: z.number().nullable().optional(),
        actual_hours: z.number().nullable().optional(),
    }),
});

// For create (POST)
const createTaskSchema = taskBase;

// For update (PUT)
const updateTaskSchema = taskBase.extend({
    params: z.object({
        id: z.string().regex(/^\d+$/, 'id must be numeric'),
    }),
});

module.exports = {
    createTaskSchema,
    updateTaskSchema,
};
