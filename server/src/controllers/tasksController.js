const { v4: uuidv4 } = require("uuid");
const { Op } = require("sequelize");
const {
  sequelize,
  Task,
  TaskChecklistItem,
  TaskAssignee,
  TaskCollaborator,
  User,
  UserProfile,
  Department,
  Office,
  Position,
  Attachment,
} = require("../models");

// ─── Helper: get user profile ──────────────────────────
const getUserProfileSummary = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ["id", "username", "email"],
  });
  if (!user) return null;
  const profile = await UserProfile.findOne({ where: { user_id: user.id } });
  let department = null,
    office = null,
    position = null,
    fullName = null;
  if (profile) {
    fullName = profile.full_name;
    if (profile.department_id) {
      const d = await Department.findByPk(profile.department_id);
      if (d) department = d.name;
    }
    if (profile.office_id) {
      const o = await Office.findByPk(profile.office_id);
      if (o) office = o.name;
    }
    if (profile.position_id) {
      const p = await Position.findByPk(profile.position_id);
      if (p) position = p.name;
    }
  }
  return {
    id: user.id,
    full_name: fullName || user.username || user.email,
    email: user.email,
    username: user.username,
    department,
    office,
    position,
  };
};

// ─── CREATE TASK ──────────────────────────────────────
exports.createTask = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const {
      title,
      color,
      priority,
      visibility,
      deadline_datetime,
      department_id,
      office_id,
      description,
      remind_before_minutes,
      is_email_reminder,
      assignee_ids,
      collaborator_ids,
      checklist_items,
    } = req.body;

    if (!title || !visibility || !deadline_datetime) {
      await t.rollback();
      return res
        .status(400)
        .json({ ok: false, message: "Missing required fields." });
    }

    const task = await Task.create(
      {
        id: uuidv4(),
        title,
        color: color || "#3B82F6",
        priority: priority || "medium",
        visibility,
        deadline_datetime,
        department_id: visibility === "department" ? department_id : null,
        office_id: office_id || null,
        creator_id: req.userId,
        description,
        remind_before_minutes: remind_before_minutes || null,
        is_email_reminder: !!is_email_reminder,
        is_completed: false,
        is_archived: false,
      },
      { transaction: t },
    );

    // ── Assignees (including creator as accepted) ──
    const assigneeIds = assignee_ids || [];
    const uniqueAssignees = [...new Set([req.userId, ...assigneeIds])];
    await TaskAssignee.bulkCreate(
      uniqueAssignees.map((userId) => ({
        task_id: task.id,
        user_id: userId,
        response: userId === req.userId ? "accepted" : "pending",
        is_original: userId === req.userId,
      })),
      { transaction: t },
    );

    // ── Collaborators ──
    const collaboratorIds = collaborator_ids || [];
    const uniqueCollaborators = [...new Set(collaboratorIds)];
    if (uniqueCollaborators.length > 0) {
      await TaskCollaborator.bulkCreate(
        uniqueCollaborators.map((userId) => ({
          task_id: task.id,
          user_id: userId,
        })),
        { transaction: t },
      );
    }

    // ── Checklist items ──
    if (
      checklist_items &&
      Array.isArray(checklist_items) &&
      checklist_items.length > 0
    ) {
      const items = checklist_items.map((item, index) => ({
        id: uuidv4(),
        task_id: task.id,
        text: item.text,
        sort_order: index,
        is_completed: false,
      }));
      await TaskChecklistItem.bulkCreate(items, { transaction: t });
    }

    await t.commit();

    // Queue emails (optional)
    // ...

    res.status(201).json({
      ok: true,
      task: { id: task.id, title: task.title },
    });
  } catch (error) {
    await t.rollback();
    console.error("Create task error:", error);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};

// ─── LIST TASKS ────────────────────────────────────────
exports.listTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const { status, visibility, priority, search } = req.query;

    // Get tasks where user is assignee, creator, or collaborator
    const assigneeTasks = await TaskAssignee.findAll({
      where: { user_id: userId },
      attributes: ["task_id"],
    });
    const assigneeTaskIds = assigneeTasks.map((a) => a.task_id);

    const collaboratorTasks = await TaskCollaborator.findAll({
      where: { user_id: userId },
      attributes: ["task_id"],
    });
    const collaboratorTaskIds = collaboratorTasks.map((c) => c.task_id);

    const allTaskIds = [
      ...new Set([...assigneeTaskIds, ...collaboratorTaskIds]),
    ];

    const where = {
      [Op.or]: [{ creator_id: userId }, { id: { [Op.in]: allTaskIds } }],
      is_archived: false,
    };

    if (status === "ongoing") {
      where.is_completed = false;
      where.deadline_datetime = { [Op.gte]: new Date() };
    } else if (status === "completed") {
      where.is_completed = true;
    } else if (status === "missed") {
      where.is_completed = false;
      where.deadline_datetime = { [Op.lt]: new Date() };
    }

    if (visibility && visibility !== "all") {
      where.visibility = visibility;
    }
    if (priority && priority !== "all") {
      where.priority = priority;
    }
    if (search) {
      where.title = { [Op.like]: `%${search}%` };
    }

    const tasks = await Task.findAll({
      where,
      order: [["deadline_datetime", "ASC"]],
      include: [
        { model: User, attributes: ["id", "username", "email"] },
        { model: Department, attributes: ["name"] },
        { model: Office, attributes: ["name"] },
        {
          model: TaskChecklistItem,
          attributes: ["id", "text", "is_completed"],
        },
      ],
    });

    // Manually fetch assignee response for each task
    const result = [];
    for (const task of tasks) {
      const assignees = await TaskAssignee.findAll({
        where: { task_id: task.id },
        include: [{ model: User, attributes: ["id", "username", "email"] }],
      });
      const userAssignee = assignees.find((a) => a.user_id === userId);
      const response = userAssignee ? userAssignee.response : null;
      const isCreator = task.creator_id === userId;
      const isCollaborator = collaboratorTaskIds.includes(task.id);

      const creatorProfile = await getUserProfileSummary(task.creator_id);

      result.push({
        id: task.id,
        title: task.title,
        color: task.color,
        priority: task.priority,
        visibility: task.visibility,
        deadline_datetime: task.deadline_datetime,
        description: task.description,
        is_completed: task.is_completed,
        creator: creatorProfile,
        assignees: assignees.map((a) => ({
          id: a.user.id,
          username: a.user.username,
          email: a.user.email,
          response: a.response,
        })),
        response,
        isCreator,
        isCollaborator,
        checklist_items: task.TaskChecklistItems || [],
      });
    }

    res.json({ ok: true, tasks: result });
  } catch (error) {
    console.error("List tasks error:", error);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};

// ─── GET TASK BY ID ────────────────────────────────────
exports.getTaskById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({ ok: false, message: "Task not found." });

    const assignees = await TaskAssignee.findAll({
      where: { task_id: id },
      include: [{ model: User, attributes: ["id", "username", "email"] }],
    });

    const collaborators = await TaskCollaborator.findAll({
      where: { task_id: id },
      include: [{ model: User, attributes: ["id", "username", "email"] }],
    });

    const checklist = await TaskChecklistItem.findAll({
      where: { task_id: id },
      order: [["sort_order", "ASC"]],
      include: [
        {
          model: User,
          as: "completedBy",
          attributes: ["id", "username", "email"],
        },
      ],
    });

    const creatorProfile = await getUserProfileSummary(task.creator_id);

    const userAssignee = assignees.find((a) => a.user_id === userId);
    const response = userAssignee ? userAssignee.response : null;

    res.json({
      ok: true,
      task: {
        id: task.id,
        title: task.title,
        color: task.color,
        priority: task.priority,
        visibility: task.visibility,
        deadline_datetime: task.deadline_datetime,
        description: task.description,
        is_completed: task.is_completed,
        creator: creatorProfile,
        assignees: assignees.map((a) => ({
          id: a.user.id,
          username: a.user.username,
          email: a.user.email,
          response: a.response,
        })),
        collaborators: collaborators.map((c) => ({
          id: c.user.id,
          username: c.user.username,
          email: c.user.email,
        })),
        checklist: checklist.map((item) => ({
          id: item.id,
          text: item.text,
          is_completed: item.is_completed,
          completed_by: item.completedBy
            ? {
                id: item.completedBy.id,
                username: item.completedBy.username,
                email: item.completedBy.email,
              }
            : null,
          completed_at: item.completed_at,
          comments: item.comments,
        })),
        response,
      },
    });
  } catch (error) {
    console.error("Get task error:", error);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};

// ─── UPDATE TASK ───────────────────────────────────────
exports.updateTask = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const {
      title,
      color,
      priority,
      visibility,
      deadline_datetime,
      department_id,
      office_id,
      description,
      remind_before_minutes,
      is_email_reminder,
      assignee_ids,
      collaborator_ids,
      checklist_items,
    } = req.body;

    const task = await Task.findByPk(id);
    if (!task) {
      await t.rollback();
      return res.status(404).json({ ok: false, message: "Task not found." });
    }

    // Check permission: creator or collaborator
    const isCreator = task.creator_id === req.userId;
    const isCollaborator = await TaskCollaborator.findOne({
      where: { task_id: id, user_id: req.userId },
    });
    if (!isCreator && !isCollaborator) {
      await t.rollback();
      return res
        .status(403)
        .json({ ok: false, message: "Not authorized to edit." });
    }

    await task.update(
      {
        title,
        color: color || "#3B82F6",
        priority: priority || "medium",
        visibility,
        deadline_datetime,
        department_id: visibility === "department" ? department_id : null,
        office_id: office_id || null,
        description,
        remind_before_minutes: remind_before_minutes || null,
        is_email_reminder: !!is_email_reminder,
        updated_at: new Date(),
      },
      { transaction: t },
    );

    // ── Update assignees ──
    const submittedAssigneeIds = assignee_ids || [];
    const existingAssignees = await TaskAssignee.findAll({
      where: { task_id: id },
      attributes: ["user_id", "response"],
    });
    const existingMap = {};
    existingAssignees.forEach((a) => {
      existingMap[a.user_id] = a.response;
    });

    // Remove assignees not in submitted list (except creator)
    const toRemove = existingAssignees
      .filter(
        (a) =>
          a.user_id !== task.creator_id &&
          !submittedAssigneeIds.includes(a.user_id),
      )
      .map((a) => a.user_id);
    if (toRemove.length > 0) {
      await TaskAssignee.destroy({
        where: { task_id: id, user_id: { [Op.in]: toRemove } },
        transaction: t,
      });
    }

    // Add new assignees
    const toAdd = submittedAssigneeIds.filter(
      (id) => id !== task.creator_id && !(id in existingMap),
    );
    if (toAdd.length > 0) {
      await TaskAssignee.bulkCreate(
        toAdd.map((userId) => ({
          task_id: id,
          user_id: userId,
          response: "pending",
          is_original: false,
        })),
        { transaction: t },
      );
    }

    // ── Update collaborators ──
    const submittedCollabIds = collaborator_ids || [];
    await TaskCollaborator.destroy({
      where: { task_id: id },
      transaction: t,
    });
    if (submittedCollabIds.length > 0) {
      await TaskCollaborator.bulkCreate(
        submittedCollabIds.map((userId) => ({
          task_id: id,
          user_id: userId,
        })),
        { transaction: t },
      );
    }

    // ── Update checklist items ──
    if (checklist_items && Array.isArray(checklist_items)) {
      // Delete existing items
      await TaskChecklistItem.destroy({
        where: { task_id: id },
        transaction: t,
      });
      // Create new items
      const items = checklist_items.map((item, index) => ({
        id: uuidv4(),
        task_id: id,
        text: item.text,
        sort_order: index,
        is_completed: item.is_completed || false,
      }));
      if (items.length > 0) {
        await TaskChecklistItem.bulkCreate(items, { transaction: t });
      }
    }

    await t.commit();

    res.json({ ok: true, message: "Task updated successfully." });
  } catch (error) {
    await t.rollback();
    console.error("Update task error:", error);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};

// ─── TOGGLE CHECKLIST ITEM ─────────────────────────────
exports.toggleChecklistItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { is_completed, comments } = req.body;

    const item = await TaskChecklistItem.findByPk(itemId);
    if (!item)
      return res.status(404).json({ ok: false, message: "Item not found." });

    // Check if user is assignee or collaborator or creator
    const task = await Task.findByPk(item.task_id);
    if (!task)
      return res.status(404).json({ ok: false, message: "Task not found." });

    const isAssignee = await TaskAssignee.findOne({
      where: { task_id: task.id, user_id: req.userId },
    });
    const isCollaborator = await TaskCollaborator.findOne({
      where: { task_id: task.id, user_id: req.userId },
    });
    if (!isAssignee && !isCollaborator && task.creator_id !== req.userId) {
      return res.status(403).json({ ok: false, message: "Not authorized." });
    }

    item.is_completed =
      is_completed !== undefined ? is_completed : !item.is_completed;
    if (item.is_completed) {
      item.completed_by_user_id = req.userId;
      item.completed_at = new Date();
    } else {
      item.completed_by_user_id = null;
      item.completed_at = null;
    }
    if (comments !== undefined) {
      item.comments = comments;
    }
    await item.save();

    res.json({ ok: true, item });
  } catch (error) {
    console.error("Toggle checklist error:", error);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};

// ─── RESPOND TO TASK INVITATION ───────────────────────
exports.respondToTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { response } = req.body;

    if (!["accepted", "declined"].includes(response)) {
      return res.status(400).json({ ok: false, message: "Invalid response." });
    }

    const assignee = await TaskAssignee.findOne({
      where: { task_id: taskId, user_id: req.userId },
    });
    if (!assignee) {
      return res
        .status(404)
        .json({ ok: false, message: "You are not assigned to this task." });
    }
    if (assignee.response !== "pending") {
      return res
        .status(400)
        .json({ ok: false, message: "You already responded." });
    }

    assignee.response = response;
    await assignee.save();

    res.json({ ok: true, message: `Task ${response}.` });
  } catch (error) {
    console.error("Respond to task error:", error);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};

// ─── GET INVITED TASKS (for Notifications) ────────────
exports.getInvitedTasks = async (req, res) => {
  try {
    const userId = req.userId;
    const { response } = req.query;

    const where = { user_id: userId };
    if (response && ["pending", "accepted", "declined"].includes(response)) {
      where.response = response;
    } else {
      where.response = "pending";
    }

    const assignees = await TaskAssignee.findAll({
      where,
      include: [
        {
          model: Task,
          where: { is_archived: false },
          include: [
            { model: User, attributes: ["id", "username", "email"] },
            { model: Department, attributes: ["name"] },
            { model: Office, attributes: ["name"] },
          ],
        },
      ],
    });

    const tasks = assignees.map((a) => {
      const task = a.Task;
      const creatorProfile = task.User
        ? {
            username: task.User.username,
            email: task.User.email,
          }
        : null;
      return {
        id: task.id,
        title: task.title,
        color: task.color,
        priority: task.priority,
        deadline_datetime: task.deadline_datetime,
        visibility: task.visibility,
        creator: creatorProfile,
        response: a.response,
      };
    });

    res.json({ ok: true, tasks });
  } catch (error) {
    console.error("Get invited tasks error:", error);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};

// ─── DELETE TASK (Archive) ────────────────────────────
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task)
      return res.status(404).json({ ok: false, message: "Task not found." });

    if (task.creator_id !== req.userId) {
      return res
        .status(403)
        .json({ ok: false, message: "Only creator can delete." });
    }

    task.is_archived = true;
    await task.save();

    res.json({ ok: true, message: "Task archived." });
  } catch (error) {
    console.error("Delete task error:", error);
    res.status(500).json({ ok: false, message: "Server error." });
  }
};
