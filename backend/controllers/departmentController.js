const Department = require('../models/Department');

const generateShortName = async (name) => {
  const words = name.trim().split(/\s+/).filter(Boolean);
  let candidate = '';
  if (words.length > 1) {
    candidate = words.map((w) => w[0]).join('').toUpperCase();
  } else {
    candidate = words[0].slice(0, 4).toUpperCase();
  }
  if (candidate.length < 2) candidate = (name.trim().toUpperCase() + 'XX').slice(0, 2);
  if (candidate.length > 8) candidate = candidate.slice(0, 8);

  let finalShort = candidate;
  let counter = 1;
  while (await Department.findOne({ shortName: finalShort, isActive: true })) {
    const suffix = String(counter);
    finalShort = candidate.slice(0, 8 - suffix.length) + suffix;
    counter++;
    if (counter > 99) break;
  }
  return finalShort;
};

exports.createDepartment = async (req, res) => {
  try {
    let { name, shortName, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Please provide department name' });
    }

    const trimmedName = name.trim();

    // Auto-generate shortName if not provided
    if (!shortName || !shortName.trim()) {
      shortName = await generateShortName(trimmedName);
    } else {
      shortName = shortName.trim().toUpperCase();
      if (shortName.length < 2 || shortName.length > 8) {
        return res.status(400).json({ message: 'Short Name must be between 2 and 8 characters' });
      }
    }

    // Check if department with same name or shortName already exists
    const existing = await Department.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } },
        { shortName },
      ],
    });

    if (existing) {
      if (!existing.isActive) {
        existing.name = trimmedName;
        existing.shortName = shortName;
        existing.description = description || '';
        existing.isActive = true;
        await existing.save();
        return res.status(201).json({ message: 'Department created successfully', department: existing });
      }
      const duplicateField = existing.shortName === shortName ? 'short name' : 'name';
      return res.status(400).json({
        message: `Department with this ${duplicateField} already exists`,
      });
    }

    const department = new Department({
      name: trimmedName,
      shortName,
      description: description ? description.trim() : '',
    });

    await department.save();
    res.status(201).json({ message: 'Department created successfully', department });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Department with this name or short name already exists' });
    }
    res.status(400).json({ message: error.message || 'Failed to create department' });
  }
};

exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true });
    res.json(departments);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch departments', error: error.message });
  }
};

exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json(department);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch department', error: error.message });
  }
};

exports.updateDepartment = async (req, res) => {
  try {
    const { name, shortName, description } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, shortName, description },
      { new: true, runValidators: true }
    );
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department updated successfully', department });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update department', error: error.message });
  }
};

exports.deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ message: 'Department not found' });
    }
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete department', error: error.message });
  }
};
