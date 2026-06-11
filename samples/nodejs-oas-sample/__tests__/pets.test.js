const request = require('supertest');
const app = require('../src/server');
const { resetPets } = require('../src/routes/pets');

// Reset the in-memory pet store before each test to ensure isolation
beforeEach(() => {
  resetPets();
});

describe('Health Endpoint', () => {
  test('GET /api/v1/health returns status ok', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('version');
  });
});

describe('Pets API', () => {

  describe('GET /api/v1/pets', () => {
    test('returns a list of pets with pagination', async () => {
      const res = await request(app).get('/api/v1/pets');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(3);
      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.total).toBe(3);
    });

    test('supports limit and offset query params', async () => {
      const res = await request(app).get('/api/v1/pets?limit=1&offset=1');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Whiskers');
      expect(res.body.pagination.hasMore).toBe(true);
    });

    test('returns 400 for invalid limit', async () => {
      const res = await request(app).get('/api/v1/pets?limit=200');
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_PARAMETER');
    });
  });

  describe('POST /api/v1/pets', () => {
    test('creates a new pet with valid data', async () => {
      const newPet = { name: 'Nemo', species: 'fish', age: 1 };
      const res = await request(app)
        .post('/api/v1/pets')
        .send(newPet);
      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Nemo');
      expect(res.body.species).toBe('fish');
      expect(res.body.status).toBe('available');
      expect(res.body).toHaveProperty('id');
    });

    test('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/pets')
        .send({ species: 'dog' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('returns 400 for invalid species', async () => {
      const res = await request(app)
        .post('/api/v1/pets')
        .send({ name: 'Rex', species: 'dinosaur' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/pets/:petId', () => {
    test('returns a pet by ID', async () => {
      const res = await request(app).get('/api/v1/pets/pet-001');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Buddy');
      expect(res.body.species).toBe('dog');
    });

    test('returns 404 for non-existent pet', async () => {
      const res = await request(app).get('/api/v1/pets/pet-999');
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });
  });

  describe('PUT /api/v1/pets/:petId', () => {
    test('updates an existing pet', async () => {
      const res = await request(app)
        .put('/api/v1/pets/pet-001')
        .send({ name: 'Buddy Jr.', status: 'adopted' });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Buddy Jr.');
      expect(res.body.status).toBe('adopted');
    });

    test('returns 404 when updating non-existent pet', async () => {
      const res = await request(app)
        .put('/api/v1/pets/pet-999')
        .send({ name: 'Ghost' });
      expect(res.status).toBe(404);
    });

    test('returns 400 for invalid status value', async () => {
      const res = await request(app)
        .put('/api/v1/pets/pet-001')
        .send({ status: 'invalid-status' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('DELETE /api/v1/pets/:petId', () => {
    test('deletes an existing pet', async () => {
      const res = await request(app).delete('/api/v1/pets/pet-001');
      expect(res.status).toBe(204);

      // Verify the pet is removed from the list
      const listRes = await request(app).get('/api/v1/pets');
      expect(listRes.body.data).toHaveLength(2);
    });

    test('returns 404 when deleting non-existent pet', async () => {
      const res = await request(app).delete('/api/v1/pets/pet-999');
      expect(res.status).toBe(404);
    });
  });
});
