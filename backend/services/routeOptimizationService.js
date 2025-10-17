const Route = require('../models/Route');
const WasteBin = require('../models/WasteBin');
const User = require('../models/User');

class RouteOptimizationService {
  
  static async optimizeRoute(routeId, algorithm = 'dijkstra', options = {}) {
    try {
      const route = await Route.findById(routeId).populate({
        path: 'wasteBins.bin',
        model: 'WasteBin'
      });

      if (!route) {
        throw new Error('Route not found');
      }

      const optimizationResult = await this.runOptimizationAlgorithm(
        route, 
        algorithm, 
        options
      );

      // Update route with optimization results
      route.wasteBins = optimizationResult.optimizedSequence;
      route.optimization = {
        isOptimized: true,
        optimizedAt: new Date(),
        algorithm: algorithm,
        estimatedDistance: optimizationResult.totalDistance,
        estimatedFuelCost: optimizationResult.estimatedFuelCost,
        estimatedTime: optimizationResult.totalTime,
        improvementPercentage: optimizationResult.improvementPercentage
      };

      if (optimizationResult.routeGeometry) {
        route.routeGeometry = optimizationResult.routeGeometry;
      }

      await route.save();

      return {
        routeId: route._id,
        algorithm: algorithm,
        optimization: route.optimization,
        previousDistance: optimizationResult.previousDistance,
        newDistance: optimizationResult.totalDistance,
        timeSaved: optimizationResult.timeSaved,
        fuelSaved: optimizationResult.fuelSaved,
        costSavings: optimizationResult.costSavings,
        optimizedSequence: optimizationResult.optimizedSequence
      };

    } catch (error) {
      console.error('Route optimization failed:', error);
      throw error;
    }
  }

  static async runOptimizationAlgorithm(route, algorithm, options) {
    switch (algorithm) {
      case 'dijkstra':
        return await this.dijkstraOptimization(route, options);
      case 'genetic':
        return await this.geneticAlgorithmOptimization(route, options);
      case 'ant_colony':
        return await this.antColonyOptimization(route, options);
      case 'nearest_neighbor':
        return await this.nearestNeighborOptimization(route, options);
      case 'simulated_annealing':
        return await this.simulatedAnnealingOptimization(route, options);
      default:
        return await this.dijkstraOptimization(route, options);
    }
  }

  // Dijkstra's Algorithm for shortest path optimization
  static async dijkstraOptimization(route, options = {}) {
    const bins = route.wasteBins.map(wb => wb.bin);
    const n = bins.length;
    
    if (n === 0) return this.createEmptyResult(route);

    // Create distance matrix
    const distanceMatrix = await this.createDistanceMatrix(bins, options);
    
    // Calculate original route metrics
    const originalMetrics = this.calculateRouteMetrics(
      route.wasteBins.map(wb => wb.sequenceOrder), 
      distanceMatrix, 
      bins
    );

    // Apply Dijkstra's algorithm for TSP approximation
    const optimizedSequence = this.solveTSPDijkstra(distanceMatrix);
    
    // Calculate optimized route metrics
    const optimizedMetrics = this.calculateRouteMetrics(optimizedSequence, distanceMatrix, bins);
    
    // Create optimized waste bins array with new sequence
    const optimizedWasteBins = optimizedSequence.map((binIndex, index) => ({
      bin: bins[binIndex]._id,
      sequenceOrder: index + 1,
      estimatedTime: options.timePerStop || 5,
      priority: route.wasteBins[binIndex].priority
    }));

    return {
      optimizedSequence: optimizedWasteBins,
      totalDistance: optimizedMetrics.totalDistance,
      totalTime: optimizedMetrics.totalTime,
      estimatedFuelCost: optimizedMetrics.fuelCost,
      previousDistance: originalMetrics.totalDistance,
      improvementPercentage: this.calculateImprovement(
        originalMetrics.totalDistance, 
        optimizedMetrics.totalDistance
      ),
      timeSaved: originalMetrics.totalTime - optimizedMetrics.totalTime,
      fuelSaved: originalMetrics.fuelCost - optimizedMetrics.fuelCost,
      costSavings: (originalMetrics.fuelCost - optimizedMetrics.fuelCost) * 1.2, // Include operational costs
      routeGeometry: await this.generateRouteGeometry(optimizedSequence, bins, options)
    };
  }

  // Genetic Algorithm optimization
  static async geneticAlgorithmOptimization(route, options = {}) {
    const bins = route.wasteBins.map(wb => wb.bin);
    const n = bins.length;
    
    if (n === 0) return this.createEmptyResult(route);

    const distanceMatrix = await this.createDistanceMatrix(bins, options);
    const originalMetrics = this.calculateRouteMetrics(
      route.wasteBins.map((wb, i) => i), 
      distanceMatrix, 
      bins
    );

    // Genetic Algorithm parameters
    const populationSize = Math.min(100, Math.max(20, n * 4));
    const generations = Math.min(500, n * 10);
    const mutationRate = 0.1;
    const eliteSize = Math.floor(populationSize * 0.2);

    // Initialize population
    let population = this.initializePopulation(populationSize, n);
    
    // Evolution loop
    for (let generation = 0; generation < generations; generation++) {
      // Evaluate fitness
      const fitness = population.map(individual => 
        1 / this.calculateRouteMetrics(individual, distanceMatrix, bins).totalDistance
      );

      // Selection
      const selected = this.tournamentSelection(population, fitness, populationSize);
      
      // Crossover
      const offspring = this.orderCrossover(selected);
      
      // Mutation
      const mutated = this.mutatePopulation(offspring, mutationRate);
      
      // Elitism
      population = this.applyElitism(population, mutated, fitness, eliteSize);
    }

    // Get best solution
    const bestFitness = population.map(individual => 
      this.calculateRouteMetrics(individual, distanceMatrix, bins).totalDistance
    );
    const bestIndex = bestFitness.indexOf(Math.min(...bestFitness));
    const optimizedSequence = population[bestIndex];

    const optimizedMetrics = this.calculateRouteMetrics(optimizedSequence, distanceMatrix, bins);
    
    const optimizedWasteBins = optimizedSequence.map((binIndex, index) => ({
      bin: bins[binIndex]._id,
      sequenceOrder: index + 1,
      estimatedTime: options.timePerStop || 5,
      priority: route.wasteBins[binIndex].priority
    }));

    return {
      optimizedSequence: optimizedWasteBins,
      totalDistance: optimizedMetrics.totalDistance,
      totalTime: optimizedMetrics.totalTime,
      estimatedFuelCost: optimizedMetrics.fuelCost,
      previousDistance: originalMetrics.totalDistance,
      improvementPercentage: this.calculateImprovement(
        originalMetrics.totalDistance, 
        optimizedMetrics.totalDistance
      ),
      timeSaved: originalMetrics.totalTime - optimizedMetrics.totalTime,
      fuelSaved: originalMetrics.fuelCost - optimizedMetrics.fuelCost,
      costSavings: (originalMetrics.fuelCost - optimizedMetrics.fuelCost) * 1.2,
      routeGeometry: await this.generateRouteGeometry(optimizedSequence, bins, options)
    };
  }

  // Ant Colony Optimization
  static async antColonyOptimization(route, options = {}) {
    const bins = route.wasteBins.map(wb => wb.bin);
    const n = bins.length;
    
    if (n === 0) return this.createEmptyResult(route);

    const distanceMatrix = await this.createDistanceMatrix(bins, options);
    const originalMetrics = this.calculateRouteMetrics(
      route.wasteBins.map((wb, i) => i), 
      distanceMatrix, 
      bins
    );

    // ACO parameters
    const numAnts = Math.min(50, n * 2);
    const numIterations = Math.min(200, n * 5);
    const alpha = 1.0; // pheromone importance
    const beta = 2.0;  // distance importance
    const rho = 0.1;   // evaporation rate
    const Q = 1.0;     // pheromone constant

    // Initialize pheromone matrix
    let pheromones = Array(n).fill().map(() => Array(n).fill(1.0));
    let bestRoute = null;
    let bestDistance = Infinity;

    for (let iteration = 0; iteration < numIterations; iteration++) {
      const routes = [];
      const distances = [];

      // Each ant constructs a solution
      for (let ant = 0; ant < numAnts; ant++) {
        const route = this.constructAntRoute(distanceMatrix, pheromones, alpha, beta);
        const distance = this.calculateRouteMetrics(route, distanceMatrix, bins).totalDistance;
        
        routes.push(route);
        distances.push(distance);

        if (distance < bestDistance) {
          bestDistance = distance;
          bestRoute = [...route];
        }
      }

      // Update pheromones
      pheromones = this.updatePheromones(pheromones, routes, distances, rho, Q);
    }

    const optimizedMetrics = this.calculateRouteMetrics(bestRoute, distanceMatrix, bins);
    
    const optimizedWasteBins = bestRoute.map((binIndex, index) => ({
      bin: bins[binIndex]._id,
      sequenceOrder: index + 1,
      estimatedTime: options.timePerStop || 5,
      priority: route.wasteBins[binIndex].priority
    }));

    return {
      optimizedSequence: optimizedWasteBins,
      totalDistance: optimizedMetrics.totalDistance,
      totalTime: optimizedMetrics.totalTime,
      estimatedFuelCost: optimizedMetrics.fuelCost,
      previousDistance: originalMetrics.totalDistance,
      improvementPercentage: this.calculateImprovement(
        originalMetrics.totalDistance, 
        optimizedMetrics.totalDistance
      ),
      timeSaved: originalMetrics.totalTime - optimizedMetrics.totalTime,
      fuelSaved: originalMetrics.fuelCost - optimizedMetrics.fuelCost,
      costSavings: (originalMetrics.fuelCost - optimizedMetrics.fuelCost) * 1.2,
      routeGeometry: await this.generateRouteGeometry(bestRoute, bins, options)
    };
  }

  // Nearest Neighbor Heuristic
  static async nearestNeighborOptimization(route, options = {}) {
    const bins = route.wasteBins.map(wb => wb.bin);
    const n = bins.length;
    
    if (n === 0) return this.createEmptyResult(route);

    const distanceMatrix = await this.createDistanceMatrix(bins, options);
    const originalMetrics = this.calculateRouteMetrics(
      route.wasteBins.map((wb, i) => i), 
      distanceMatrix, 
      bins
    );

    // Start from depot (assume first bin is depot)
    const optimizedSequence = [0];
    const unvisited = Array.from({ length: n }, (_, i) => i + 1).slice(1);

    let current = 0;
    while (unvisited.length > 0) {
      let nearest = unvisited[0];
      let minDistance = distanceMatrix[current][nearest];

      for (let i = 1; i < unvisited.length; i++) {
        const candidate = unvisited[i];
        if (distanceMatrix[current][candidate] < minDistance) {
          minDistance = distanceMatrix[current][candidate];
          nearest = candidate;
        }
      }

      optimizedSequence.push(nearest);
      unvisited.splice(unvisited.indexOf(nearest), 1);
      current = nearest;
    }

    const optimizedMetrics = this.calculateRouteMetrics(optimizedSequence, distanceMatrix, bins);
    
    const optimizedWasteBins = optimizedSequence.map((binIndex, index) => ({
      bin: bins[binIndex]._id,
      sequenceOrder: index + 1,
      estimatedTime: options.timePerStop || 5,
      priority: route.wasteBins[binIndex].priority
    }));

    return {
      optimizedSequence: optimizedWasteBins,
      totalDistance: optimizedMetrics.totalDistance,
      totalTime: optimizedMetrics.totalTime,
      estimatedFuelCost: optimizedMetrics.fuelCost,
      previousDistance: originalMetrics.totalDistance,
      improvementPercentage: this.calculateImprovement(
        originalMetrics.totalDistance, 
        optimizedMetrics.totalDistance
      ),
      timeSaved: originalMetrics.totalTime - optimizedMetrics.totalTime,
      fuelSaved: originalMetrics.fuelCost - optimizedMetrics.fuelCost,
      costSavings: (originalMetrics.fuelCost - optimizedMetrics.fuelCost) * 1.2,
      routeGeometry: await this.generateRouteGeometry(optimizedSequence, bins, options)
    };
  }

  // Helper methods for optimization algorithms

  static async createDistanceMatrix(bins, options = {}) {
    const n = bins.length;
    const matrix = Array(n).fill().map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          matrix[i][j] = this.calculateDistance(
            bins[i].location.coordinates,
            bins[j].location.coordinates,
            options.distanceType || 'euclidean'
          );
        }
      }
    }

    return matrix;
  }

  static calculateDistance(coord1, coord2, type = 'euclidean') {
    const [lng1, lat1] = coord1;
    const [lng2, lat2] = coord2;

    if (type === 'haversine') {
      // Haversine formula for great-circle distance
      const R = 6371; // Earth's radius in km
      const dLat = this.toRadians(lat2 - lat1);
      const dLng = this.toRadians(lng2 - lng1);
      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    } else {
      // Euclidean distance
      return Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2)) * 111; // Approximate km conversion
    }
  }

  static toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  static calculateRouteMetrics(sequence, distanceMatrix, bins) {
    let totalDistance = 0;
    let totalTime = 0;
    const fuelConsumptionRate = 0.3; // L/km
    const fuelPrice = 150; // LKR per liter

    for (let i = 0; i < sequence.length - 1; i++) {
      totalDistance += distanceMatrix[sequence[i]][sequence[i + 1]];
    }

    // Add return to depot
    if (sequence.length > 0) {
      totalDistance += distanceMatrix[sequence[sequence.length - 1]][sequence[0]];
    }

    // Calculate time (distance/speed + service time)
    const averageSpeed = 30; // km/h
    const serviceTimePerStop = 5; // minutes
    totalTime = (totalDistance / averageSpeed) * 60 + (sequence.length * serviceTimePerStop);

    const fuelCost = totalDistance * fuelConsumptionRate * fuelPrice;

    return {
      totalDistance: totalDistance,
      totalTime: totalTime,
      fuelCost: fuelCost
    };
  }

  static calculateImprovement(original, optimized) {
    if (original === 0) return 0;
    return ((original - optimized) / original) * 100;
  }

  static createEmptyResult(route) {
    return {
      optimizedSequence: [],
      totalDistance: 0,
      totalTime: 0,
      estimatedFuelCost: 0,
      previousDistance: 0,
      improvementPercentage: 0,
      timeSaved: 0,
      fuelSaved: 0,
      costSavings: 0,
      routeGeometry: null
    };
  }

  // Genetic Algorithm helper methods
  static initializePopulation(populationSize, n) {
    const population = [];
    for (let i = 0; i < populationSize; i++) {
      const individual = Array.from({ length: n }, (_, j) => j);
      this.shuffleArray(individual);
      population.push(individual);
    }
    return population;
  }

  static shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  static tournamentSelection(population, fitness, selectionSize) {
    const selected = [];
    for (let i = 0; i < selectionSize; i++) {
      const tournament = [];
      for (let j = 0; j < 3; j++) {
        tournament.push(Math.floor(Math.random() * population.length));
      }
      const winner = tournament.reduce((best, current) => 
        fitness[current] > fitness[best] ? current : best
      );
      selected.push([...population[winner]]);
    }
    return selected;
  }

  static orderCrossover(population) {
    const offspring = [];
    for (let i = 0; i < population.length; i += 2) {
      if (i + 1 < population.length) {
        const [child1, child2] = this.performOrderCrossover(population[i], population[i + 1]);
        offspring.push(child1, child2);
      } else {
        offspring.push([...population[i]]);
      }
    }
    return offspring;
  }

  static performOrderCrossover(parent1, parent2) {
    const n = parent1.length;
    const start = Math.floor(Math.random() * n);
    const end = start + Math.floor(Math.random() * (n - start));
    
    const child1 = Array(n).fill(-1);
    const child2 = Array(n).fill(-1);
    
    // Copy segment from parents
    for (let i = start; i <= end; i++) {
      child1[i] = parent1[i];
      child2[i] = parent2[i];
    }
    
    // Fill remaining positions
    this.fillRemainingPositions(child1, parent2, start, end);
    this.fillRemainingPositions(child2, parent1, start, end);
    
    return [child1, child2];
  }

  static fillRemainingPositions(child, donor, start, end) {
    const used = new Set(child.slice(start, end + 1));
    let donorIndex = 0;
    
    for (let i = 0; i < child.length; i++) {
      if (child[i] === -1) {
        while (used.has(donor[donorIndex])) {
          donorIndex++;
        }
        child[i] = donor[donorIndex];
        used.add(donor[donorIndex]);
        donorIndex++;
      }
    }
  }

  static mutatePopulation(population, mutationRate) {
    return population.map(individual => {
      if (Math.random() < mutationRate) {
        return this.swapMutation([...individual]);
      }
      return individual;
    });
  }

  static swapMutation(individual) {
    const i = Math.floor(Math.random() * individual.length);
    const j = Math.floor(Math.random() * individual.length);
    [individual[i], individual[j]] = [individual[j], individual[i]];
    return individual;
  }

  static applyElitism(oldPop, newPop, fitness, eliteSize) {
    const combined = [...oldPop.map((ind, i) => ({ individual: ind, fitness: fitness[i] }))];
    combined.sort((a, b) => b.fitness - a.fitness);
    
    const elite = combined.slice(0, eliteSize).map(item => item.individual);
    const regular = newPop.slice(0, newPop.length - eliteSize);
    
    return [...elite, ...regular];
  }

  // Ant Colony Optimization helper methods
  static constructAntRoute(distanceMatrix, pheromones, alpha, beta) {
    const n = distanceMatrix.length;
    const route = [0]; // Start at depot
    const unvisited = Array.from({ length: n - 1 }, (_, i) => i + 1);

    while (unvisited.length > 0) {
      const current = route[route.length - 1];
      const probabilities = this.calculateAntProbabilities(
        current, unvisited, distanceMatrix, pheromones, alpha, beta
      );
      
      const next = this.selectNext(unvisited, probabilities);
      route.push(next);
      unvisited.splice(unvisited.indexOf(next), 1);
    }

    return route;
  }

  static calculateAntProbabilities(current, unvisited, distances, pheromones, alpha, beta) {
    const probabilities = [];
    let total = 0;

    for (const city of unvisited) {
      const pheromone = Math.pow(pheromones[current][city], alpha);
      const heuristic = Math.pow(1.0 / distances[current][city], beta);
      const probability = pheromone * heuristic;
      probabilities.push(probability);
      total += probability;
    }

    return probabilities.map(p => p / total);
  }

  static selectNext(unvisited, probabilities) {
    const random = Math.random();
    let cumulative = 0;

    for (let i = 0; i < probabilities.length; i++) {
      cumulative += probabilities[i];
      if (random <= cumulative) {
        return unvisited[i];
      }
    }

    return unvisited[unvisited.length - 1];
  }

  static updatePheromones(pheromones, routes, distances, rho, Q) {
    const n = pheromones.length;
    
    // Evaporation
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        pheromones[i][j] *= (1 - rho);
      }
    }

    // Pheromone deposit
    for (let k = 0; k < routes.length; k++) {
      const route = routes[k];
      const distance = distances[k];
      const deposit = Q / distance;

      for (let i = 0; i < route.length - 1; i++) {
        const from = route[i];
        const to = route[i + 1];
        pheromones[from][to] += deposit;
        pheromones[to][from] += deposit;
      }

      // Return to depot
      const last = route[route.length - 1];
      const first = route[0];
      pheromones[last][first] += deposit;
      pheromones[first][last] += deposit;
    }

    return pheromones;
  }

  static async generateRouteGeometry(sequence, bins, options) {
    // Generate route geometry based on optimized sequence
    const coordinates = sequence.map(index => bins[index].location.coordinates);
    
    return {
      type: 'LineString',
      coordinates: coordinates
    };
  }

  // TSP solver using Dijkstra's approach (approximation)
  static solveTSPDijkstra(distanceMatrix) {
    const n = distanceMatrix.length;
    if (n === 0) return [];
    if (n === 1) return [0];

    // Use nearest neighbor with 2-opt improvement
    let bestRoute = this.nearestNeighborTSP(distanceMatrix);
    bestRoute = this.twoOptImprovement(bestRoute, distanceMatrix);
    
    return bestRoute;
  }

  static nearestNeighborTSP(distanceMatrix) {
    const n = distanceMatrix.length;
    const route = [0];
    const unvisited = Array.from({ length: n - 1 }, (_, i) => i + 1);

    let current = 0;
    while (unvisited.length > 0) {
      let nearest = unvisited[0];
      let minDistance = distanceMatrix[current][nearest];

      for (let i = 1; i < unvisited.length; i++) {
        const candidate = unvisited[i];
        if (distanceMatrix[current][candidate] < minDistance) {
          minDistance = distanceMatrix[current][candidate];
          nearest = candidate;
        }
      }

      route.push(nearest);
      unvisited.splice(unvisited.indexOf(nearest), 1);
      current = nearest;
    }

    return route;
  }

  static twoOptImprovement(route, distanceMatrix) {
    let improved = true;
    let bestRoute = [...route];

    while (improved) {
      improved = false;
      const currentDistance = this.calculateTotalDistance(bestRoute, distanceMatrix);

      for (let i = 1; i < bestRoute.length - 2; i++) {
        for (let j = i + 1; j < bestRoute.length; j++) {
          const newRoute = this.twoOptSwap(bestRoute, i, j);
          const newDistance = this.calculateTotalDistance(newRoute, distanceMatrix);

          if (newDistance < currentDistance) {
            bestRoute = newRoute;
            improved = true;
          }
        }
      }
    }

    return bestRoute;
  }

  static twoOptSwap(route, i, j) {
    const newRoute = [...route];
    while (i < j) {
      [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
      i++;
      j--;
    }
    return newRoute;
  }

  static calculateTotalDistance(route, distanceMatrix) {
    let total = 0;
    for (let i = 0; i < route.length - 1; i++) {
      total += distanceMatrix[route[i]][route[i + 1]];
    }
    // Add return to start
    total += distanceMatrix[route[route.length - 1]][route[0]];
    return total;
  }

  // Simulated Annealing optimization (bonus implementation)
  static async simulatedAnnealingOptimization(route, options = {}) {
    const bins = route.wasteBins.map(wb => wb.bin);
    const n = bins.length;
    
    if (n === 0) return this.createEmptyResult(route);

    const distanceMatrix = await this.createDistanceMatrix(bins, options);
    const originalMetrics = this.calculateRouteMetrics(
      route.wasteBins.map((wb, i) => i), 
      distanceMatrix, 
      bins
    );

    // SA parameters
    let temperature = 1000.0;
    const coolingRate = 0.995;
    const minTemperature = 1.0;

    // Initialize with current route
    let currentRoute = Array.from({ length: n }, (_, i) => i);
    let currentDistance = this.calculateTotalDistance(currentRoute, distanceMatrix);
    
    let bestRoute = [...currentRoute];
    let bestDistance = currentDistance;

    while (temperature > minTemperature) {
      // Generate neighbor by swapping two random cities
      const newRoute = [...currentRoute];
      const i = Math.floor(Math.random() * n);
      const j = Math.floor(Math.random() * n);
      [newRoute[i], newRoute[j]] = [newRoute[j], newRoute[i]];
      
      const newDistance = this.calculateTotalDistance(newRoute, distanceMatrix);
      const deltaDistance = newDistance - currentDistance;

      // Accept or reject the new route
      if (deltaDistance < 0 || Math.random() < Math.exp(-deltaDistance / temperature)) {
        currentRoute = newRoute;
        currentDistance = newDistance;
        
        if (newDistance < bestDistance) {
          bestRoute = [...newRoute];
          bestDistance = newDistance;
        }
      }

      temperature *= coolingRate;
    }

    const optimizedMetrics = this.calculateRouteMetrics(bestRoute, distanceMatrix, bins);
    
    const optimizedWasteBins = bestRoute.map((binIndex, index) => ({
      bin: bins[binIndex]._id,
      sequenceOrder: index + 1,
      estimatedTime: options.timePerStop || 5,
      priority: route.wasteBins[binIndex].priority
    }));

    return {
      optimizedSequence: optimizedWasteBins,
      totalDistance: optimizedMetrics.totalDistance,
      totalTime: optimizedMetrics.totalTime,
      estimatedFuelCost: optimizedMetrics.fuelCost,
      previousDistance: originalMetrics.totalDistance,
      improvementPercentage: this.calculateImprovement(
        originalMetrics.totalDistance, 
        optimizedMetrics.totalDistance
      ),
      timeSaved: originalMetrics.totalTime - optimizedMetrics.totalTime,
      fuelSaved: originalMetrics.fuelCost - optimizedMetrics.fuelCost,
      costSavings: (originalMetrics.fuelCost - optimizedMetrics.fuelCost) * 1.2,
      routeGeometry: await this.generateRouteGeometry(bestRoute, bins, options)
    };
  }

  // Bulk optimization for multiple routes
  static async optimizeMultipleRoutes(routeIds, algorithm = 'dijkstra', options = {}) {
    const results = [];
    
    for (const routeId of routeIds) {
      try {
        const result = await this.optimizeRoute(routeId, algorithm, options);
        results.push(result);
      } catch (error) {
        results.push({
          routeId,
          error: error.message,
          success: false
        });
      }
    }

    return {
      optimizedRoutes: results.filter(r => !r.error),
      failedRoutes: results.filter(r => r.error),
      totalCostSavings: results
        .filter(r => !r.error)
        .reduce((sum, r) => sum + (r.costSavings || 0), 0),
      totalTimeSaved: results
        .filter(r => !r.error)
        .reduce((sum, r) => sum + (r.timeSaved || 0), 0)
    };
  }

  // Get optimization recommendations
  static async getOptimizationRecommendations(routeId) {
    try {
      const route = await Route.findById(routeId).populate({
        path: 'wasteBins.bin',
        model: 'WasteBin'
      });

      if (!route) {
        throw new Error('Route not found');
      }

      const recommendations = [];
      
      // Check if route needs optimization
      if (!route.optimization.isOptimized || 
          (route.optimization.optimizedAt && 
           Date.now() - route.optimization.optimizedAt.getTime() > 7 * 24 * 60 * 60 * 1000)) {
        recommendations.push({
          type: 'optimization_needed',
          priority: 'high',
          title: 'Route Optimization Required',
          description: 'This route has not been optimized recently',
          action: 'optimize_route',
          estimatedSavings: '15-30% cost reduction'
        });
      }

      // Check for high-priority bins
      const urgentBins = route.wasteBins.filter(wb => wb.priority === 'urgent').length;
      if (urgentBins > 0) {
        recommendations.push({
          type: 'urgent_collections',
          priority: 'urgent',
          title: `${urgentBins} Urgent Collections`,
          description: 'Some waste bins require immediate attention',
          action: 'prioritize_urgent',
          estimatedSavings: 'Avoid penalties'
        });
      }

      // Check route efficiency
      if (route.performance.completionRate < 0.9) {
        recommendations.push({
          type: 'efficiency_improvement',
          priority: 'medium',
          title: 'Low Completion Rate',
          description: `Current completion rate: ${(route.performance.completionRate * 100).toFixed(1)}%`,
          action: 'analyze_bottlenecks',
          estimatedSavings: '10-20% time reduction'
        });
      }

      return {
        routeId: route._id,
        routeName: route.name,
        currentOptimization: route.optimization,
        recommendations,
        lastOptimized: route.optimization.optimizedAt,
        totalPotentialSavings: recommendations.length * 15 // Rough estimate
      };

    } catch (error) {
      console.error('Error getting optimization recommendations:', error);
      throw error;
    }
  }
}

module.exports = RouteOptimizationService;