const express = require('express');
const router = express.Router();

// In-memory data store for pets (seeded with sample data)
let pets = [
  {
    id: 'pet-001',
    name: 'Buddy',
    species: 'dog',
    breed: 'Golden Retriever',
    age: 3,
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pet-002',
    name: 'Whiskers',
    species: 'cat',
    breed: 'Siamese',
    age: 2,
    status: 'available',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'pet-003',
    name: 'Tweety',
    species: 'bird',
    breed: 'Canary',
    age: 1,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Valid species and status values as defined in the OAS
const VALID_SPECIES = ['dog', 'cat', 'bird', 'fish', 'rabbit'];
const VALID_STATUSES = ['available', 'adopted', 'pending'];

/**
 * Generates a unique pet ID using a simple counter approach
 */
let idCounter = 4;
function generateId() {
  return `pet-${String(idCounter++).padStart(3, '0')}`;
}

/**
 * Validates the request body fields for creating or updating a pet.
 * Returns an array of validation error details.
 */
function validatePetFields(body, isCreate = false) {
  const errors = [];

  // Name is required on create
  if (isCreate && (!body.name || typeof body.name !== 'string')) {
    errors.push({ field: 'name', message: 'Name is required and must be a string' });
  }
  if (body.name !== undefined && (typeof body.name !== 'string' || body.name.length < 1 || body.name.length > 100)) {
    errors.push({ field: 'name', message: 'Name must be a string between 1 and 100 characters' });
  }

  // Species is required on create
  if (isCreate && !body.species) {
    errors.push({ field: 'species', message: 'Species is required' });
  }
  if (body.species !== undefined && !VALID_SPECIES.includes(body.species)) {
    errors.push({ field: 'species', message: `Species must be one of: ${VALID_SPECIES.join(', ')}` });
  }

  // Optional breed validation
  if (body.breed !== undefined && (typeof body.breed !== 'string' || body.breed.length > 100)) {
    errors.push({ field: 'breed', message: 'Breed must be a string up to 100 characters' });
  }

  // Optional age validation
  if (body.age !== undefined && (typeof body.age !== 'number' || body.age < 0 || !Number.isInteger(body.age))) {
    errors.push({ field: 'age', message: 'Age must be a non-negative integer' });
  }

  // Optional status validation
  if (body.status !== undefined && !VALID_STATUSES.includes(body.status)) {
    errors.push({ field: 'status', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  return errors;
}

/**
 * GET /api/v1/pets
 * Lists all pets with pagination support via limit and offset query params
 */
router.get('/', (req, res) => {
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  // Validate pagination parameters
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PARAMETER',
        message: 'Limit must be between 1 and 100'
      }
    });
  }
  if (offset < 0) {
    return res.status(400).json({
      error: {
        code: 'INVALID_PARAMETER',
        message: 'Offset must be non-negative'
      }
    });
  }

  // Return the paginated slice of pets with pagination metadata
  const paginatedPets = pets.slice(offset, offset + limit);
  res.json({
    data: paginatedPets,
    pagination: {
      total: pets.length,
      limit,
      offset,
      hasMore: offset + limit < pets.length
    }
  });
});

/**
 * POST /api/v1/pets
 * Creates a new pet with the provided name, species, and optional fields
 */
router.post('/', (req, res) => {
  const errors = validatePetFields(req.body, true);
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: errors
      }
    });
  }

  const now = new Date().toISOString();
  const newPet = {
    id: generateId(),
    name: req.body.name,
    species: req.body.species,
    breed: req.body.breed || null,
    age: req.body.age !== undefined ? req.body.age : null,
    status: req.body.status || 'available',
    createdAt: now,
    updatedAt: now
  };

  pets.push(newPet);
  res.status(201).json(newPet);
});

/**
 * GET /api/v1/pets/:petId
 * Retrieves a single pet by its unique ID
 */
router.get('/:petId', (req, res) => {
  const pet = pets.find(p => p.id === req.params.petId);
  if (!pet) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Pet with id '${req.params.petId}' not found`
      }
    });
  }
  res.json(pet);
});

/**
 * PUT /api/v1/pets/:petId
 * Updates an existing pet's fields (partial update supported)
 */
router.put('/:petId', (req, res) => {
  const petIndex = pets.findIndex(p => p.id === req.params.petId);
  if (petIndex === -1) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Pet with id '${req.params.petId}' not found`
      }
    });
  }

  const errors = validatePetFields(req.body, false);
  if (errors.length > 0) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request body',
        details: errors
      }
    });
  }

  // Merge updates into the existing pet record
  const updatedPet = {
    ...pets[petIndex],
    ...req.body,
    id: pets[petIndex].id, // Prevent ID override
    createdAt: pets[petIndex].createdAt, // Preserve original creation timestamp
    updatedAt: new Date().toISOString()
  };

  pets[petIndex] = updatedPet;
  res.json(updatedPet);
});

/**
 * DELETE /api/v1/pets/:petId
 * Removes a pet from the store by its unique ID
 */
router.delete('/:petId', (req, res) => {
  const petIndex = pets.findIndex(p => p.id === req.params.petId);
  if (petIndex === -1) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Pet with id '${req.params.petId}' not found`
      }
    });
  }

  pets.splice(petIndex, 1);
  res.status(204).send();
});

// Export pets array and reset function for testing purposes
module.exports = router;
module.exports.resetPets = () => {
  pets = [
    {
      id: 'pet-001',
      name: 'Buddy',
      species: 'dog',
      breed: 'Golden Retriever',
      age: 3,
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pet-002',
      name: 'Whiskers',
      species: 'cat',
      breed: 'Siamese',
      age: 2,
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'pet-003',
      name: 'Tweety',
      species: 'bird',
      breed: 'Canary',
      age: 1,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];
  idCounter = 4;
};
