const Truck = require('../models/Truck');

// Create a new truck
const createTruck = async (req, res) => {
  try {
    const {
      truckNumber,
      vehicleType,
      capacity,
      specifications,
      baseLocation
    } = req.body;

    // Check if truck number already exists
    const existingTruck = await Truck.findOne({ truckNumber: truckNumber.toUpperCase() });
    if (existingTruck) {
      return res.status(400).json({
        success: false,
        message: 'Truck number already exists'
      });
    }

    const truck = new Truck({
      truckNumber: truckNumber.toUpperCase(),
      vehicleType,
      capacity,
      specifications,
      location: {
        baseLocation
      }
    });

    await truck.save();
    
    res.status(201).json({
      success: true,
      message: 'Truck created successfully',
      truck
    });
  } catch (error) {
    console.error('Error creating truck:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create truck',
      error: error.message
    });
  }
};

// Get all trucks
const getTrucks = async (req, res) => {
  try {
    const { status, available } = req.query;
    let filter = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (available === 'true') {
      filter.assignedCollector = null;
      filter.status = 'active';
    }
    
    const trucks = await Truck.find(filter)
      .populate('assignedCollector', 'name email')
      .populate('assignedRoute', 'name routeId')
      .sort('truckNumber');
    
    res.status(200).json({
      success: true,
      trucks
    });
  } catch (error) {
    console.error('Error fetching trucks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trucks',
      error: error.message
    });
  }
};

// Get truck by ID
const getTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id)
      .populate('assignedCollector', 'name email phone')
      .populate('assignedRoute', 'name routeId cities');
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    res.status(200).json({
      success: true,
      truck
    });
  } catch (error) {
    console.error('Error fetching truck:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch truck',
      error: error.message
    });
  }
};

// Update truck
const updateTruck = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If updating truck number, check for duplicates
    if (updateData.truckNumber) {
      updateData.truckNumber = updateData.truckNumber.toUpperCase();
      const existingTruck = await Truck.findOne({ 
        truckNumber: updateData.truckNumber,
        _id: { $ne: id }
      });
      
      if (existingTruck) {
        return res.status(400).json({
          success: false,
          message: 'Truck number already exists'
        });
      }
    }
    
    const truck = await Truck.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('assignedCollector assignedRoute');
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Truck updated successfully',
      truck
    });
  } catch (error) {
    console.error('Error updating truck:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update truck',
      error: error.message
    });
  }
};

// Delete truck
const deleteTruck = async (req, res) => {
  try {
    const truck = await Truck.findById(req.params.id);
    
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    // Check if truck is assigned to a collector
    if (truck.assignedCollector) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete truck that is assigned to a collector'
      });
    }
    
    await Truck.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Truck deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting truck:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete truck',
      error: error.message
    });
  }
};

// Assign truck to collector
const assignTruckToCollector = async (req, res) => {
  try {
    const { truckId, collectorId } = req.body;
    
    const truck = await Truck.findById(truckId);
    if (!truck) {
      return res.status(404).json({
        success: false,
        message: 'Truck not found'
      });
    }
    
    if (truck.assignedCollector) {
      return res.status(400).json({
        success: false,
        message: 'Truck is already assigned to another collector'
      });
    }
    
    truck.assignedCollector = collectorId;
    await truck.save();
    
    res.status(200).json({
      success: true,
      message: 'Truck assigned to collector successfully',
      truck
    });
  } catch (error) {
    console.error('Error assigning truck:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to assign truck',
      error: error.message
    });
  }
};

// Get available trucks for assignment
const getAvailableTrucks = async (req, res) => {
  try {
    const trucks = await Truck.getAvailableTrucks();
    
    res.status(200).json({
      success: true,
      trucks
    });
  } catch (error) {
    console.error('Error fetching available trucks:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available trucks',
      error: error.message
    });
  }
};

module.exports = {
  createTruck,
  getTrucks,
  getTruck,
  updateTruck,
  deleteTruck,
  assignTruckToCollector,
  getAvailableTrucks
};