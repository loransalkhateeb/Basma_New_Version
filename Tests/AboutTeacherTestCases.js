const request = require('supertest');
const app = require('../app');
const { client } = require('../Utils/redisClient');
const AboutTeacher = require('../Models/AboutTeacher');

jest.mock('../Models/AboutTeacher');
jest.mock('../Utils/redisClient');

const mockAboutTeacher = {
  id: 1,
  title: 'Sample Teacher Title',
  descr: 'Sample Description',
  para: 'Sample paragraph.',
  img: 'sample.png',
};

describe('AboutTeacher Controller Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /aboutTeacher', () => {
    it('should create a new AboutTeacher entry successfully', async () => {
      AboutTeacher.create.mockResolvedValue(mockAboutTeacher);
      client.set.mockResolvedValue(true);

      const res = await request(app)
        .post('/aboutTeacher')
        .field('title', 'Sample Teacher Title')
        .field('descr', 'Sample Description')
        .field('para', 'Sample paragraph.')
        .attach('img', Buffer.from('fake-image'), 'sample.png');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'About Teacher created successfully');
      expect(res.body.hero).toMatchObject(mockAboutTeacher);
    });

    it('should return validation error for missing fields', async () => {
      const res = await request(app)
        .post('/aboutTeacher')
        .send({ title: '', descr: '', para: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('GET /aboutTeacher', () => {
    it('should fetch all AboutTeacher entries successfully', async () => {
      AboutTeacher.findAll.mockResolvedValue([mockAboutTeacher]);
      client.get.mockResolvedValue(null);

      const res = await request(app).get('/aboutTeacher');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockAboutTeacher]);
    });

    it('should return cached data if available', async () => {
      client.get.mockResolvedValue(JSON.stringify([mockAboutTeacher]));

      const res = await request(app).get('/aboutTeacher');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockAboutTeacher]);
    });
  });

  describe('GET /aboutTeacher/:id', () => {
    it('should fetch an AboutTeacher entry by ID successfully', async () => {
      AboutTeacher.findByPk.mockResolvedValue(mockAboutTeacher);
      client.get.mockResolvedValue(null);

      const res = await request(app).get('/aboutTeacher/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(mockAboutTeacher);
    });

    it('should return error for non-existing ID', async () => {
      AboutTeacher.findByPk.mockResolvedValue(null);

      const res = await request(app).get('/aboutTeacher/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('PUT /aboutTeacher/:id', () => {
    it('should update an AboutTeacher entry successfully', async () => {
      AboutTeacher.findByPk.mockResolvedValue(mockAboutTeacher);
      AboutTeacher.prototype.save = jest.fn().mockResolvedValue({ ...mockAboutTeacher, title: 'Updated Title' });
      client.set.mockResolvedValue(true);

      const res = await request(app)
        .put('/aboutTeacher/1')
        .send({ title: 'Updated Title', descr: 'Updated Description', para: 'Updated paragraph.' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'About Teacher entry updated successfully');
      expect(res.body.aboutTeacher.title).toBe('Updated Title');
    });

    it('should return error for non-existing ID', async () => {
      AboutTeacher.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put('/aboutTeacher/999')
        .send({ title: 'Updated Title', descr: 'Updated Description', para: 'Updated paragraph.' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /aboutTeacher/:id', () => {
    it('should delete an AboutTeacher entry successfully', async () => {
      AboutTeacher.findByPk.mockResolvedValue(mockAboutTeacher);
      AboutTeacher.destroy = jest.fn().mockResolvedValue(true);
      client.del.mockResolvedValue(true);

      const res = await request(app).delete('/aboutTeacher/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'AboutTeacher deleted successfully');
    });

    it('should return error for non-existing ID', async () => {
      AboutTeacher.findByPk.mockResolvedValue(null);

      const res = await request(app).delete('/aboutTeacher/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errors');
    });
  });
});
