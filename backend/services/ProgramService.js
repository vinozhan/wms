const Program = require('../models/Program');

class ProgramService {
  async getAllPrograms(filters = {}) {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      search
    } = filters;

    const query = {};
    
    if (status) query.status = status;
    if (type) query.type = type;
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const programs = await Program.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Program.countDocuments(query);

    return {
      programs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    };
  }

  async getProgramById(id) {
    return await Program.findById(id);
  }

  async createProgram(programData) {
    const program = new Program(programData);
    return await program.save();
  }

  async updateProgram(id, updateData) {
    return await Program.findByIdAndUpdate(
      id,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
  }

  async approveProgram(id, approvalData) {
    const { approvedBy, notes } = approvalData;
    
    return await Program.findByIdAndUpdate(
      id,
      {
        status: 'approved',
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
        $push: {
          'timeline.milestones': {
            name: 'Program Approved',
            targetDate: new Date(),
            completed: true,
            completedDate: new Date()
          }
        }
      },
      { new: true, runValidators: true }
    );
  }

  async deleteProgram(id) {
    return await Program.findByIdAndDelete(id);
  }

  async addMilestone(programId, milestone) {
    const program = await Program.findById(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    return await program.addMilestone(milestone);
  }

  async completeMilestone(programId, milestoneIndex) {
    const program = await Program.findById(programId);
    if (!program) {
      throw new Error('Program not found');
    }

    return await program.completeMilestone(milestoneIndex);
  }
}

module.exports = new ProgramService();