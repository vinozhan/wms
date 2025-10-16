// Minimal working dashboard controller
exports.getOverview = async (req, res) => {
  console.log('Dashboard overview requested');
  
  const data = {
    stats: {
      totalCompanies: 45,
      activePrograms: 12,
      pendingIssues: 23,
      resolvedThisMonth: 156,
      complianceRate: 87,
      avgCollectionRate: 92,
      totalWasteCollected: 12500
    },
    recentCompanies: [],
    recentIssues: [],
    recentPrograms: [],
    topRankings: []
  };

  res.json({
    success: true,
    data
  });
};

exports.getAnalytics = async (req, res) => {
  console.log('Dashboard analytics requested');
  
  const data = {
    monthlyPerformance: [
      { month: 'Jan', efficiency: 85, compliance: 90, collection: 88 },
      { month: 'Feb', efficiency: 87, compliance: 92, collection: 90 },
      { month: 'Mar', efficiency: 89, compliance: 91, collection: 92 },
      { month: 'Apr', efficiency: 91, compliance: 93, collection: 91 },
      { month: 'May', efficiency: 90, compliance: 94, collection: 93 },
      { month: 'Jun', efficiency: 92, compliance: 95, collection: 94 }
    ],
    issueTrends: {
      missedPickups: [12, 8, 15, 10, 7, 9],
      damagedBins: [5, 3, 7, 4, 6, 3],
      complaints: [8, 12, 6, 9, 11, 7]
    },
    programProgress: [
      { program: 'Recycling Initiative', progress: 75 },
      { program: 'Composting Program', progress: 60 },
      { program: 'Hazardous Waste', progress: 90 },
      { program: 'Bulk Collection', progress: 45 }
    ]
  };

  res.json({
    success: true,
    data
  });
};