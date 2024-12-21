const request = require('supertest');
const app = require('../app'); 
const { client } = require('../Utils/redisClient');
const About = require('../Models/AboutModel');

jest.mock('../Models/AboutModel');
jest.mock('../Utils/redisClient');


const mockAboutEntry = {
  id: 1,
  title: 'Sample Title',
  descr: 'Sample Description',
  img: 'sample.png',
};

describe('About Controller Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /about', () => {
    it('should create a new about entry successfully', async () => {
      About.create.mockResolvedValue(mockAboutEntry);
      client.set.mockResolvedValue(true);

      const res = await request(app)
        .post('/about')
        .field('title', 'Sample Title')
        .field('descr', 'Sample Description')
        .attach('img', Buffer.from('fake-image'), 'sample.png');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message', 'Hero created successfully');
      expect(res.body.hero).toMatchObject(mockAboutEntry);
    });

    it('should return validation error for missing fields', async () => {
      const res = await request(app)
        .post('/about')
        .send({ title: '', descr: '' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('GET /about', () => {
    it('should fetch all about entries successfully', async () => {
      About.findAll.mockResolvedValue([mockAboutEntry]);
      client.get.mockResolvedValue(null);

      const res = await request(app).get('/about');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockAboutEntry]);
    });

    it('should return cached data if available', async () => {
      client.get.mockResolvedValue(JSON.stringify([mockAboutEntry]));

      const res = await request(app).get('/about');

      expect(res.status).toBe(200);
      expect(res.body).toEqual([mockAboutEntry]);
    });
  });

  describe('GET /about/:id', () => {
    it('should fetch an about entry by ID successfully', async () => {
      About.findOne.mockResolvedValue(mockAboutEntry);
      client.get.mockResolvedValue(null);

      const res = await request(app).get('/about/1');

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject(mockAboutEntry);
    });

    it('should return error for non-existing ID', async () => {
      About.findOne.mockResolvedValue(null);

      const res = await request(app).get('/about/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('PUT /about/:id', () => {
    it('should update an about entry successfully', async () => {
      About.findByPk.mockResolvedValue(mockAboutEntry);
      About.prototype.save = jest.fn().mockResolvedValue({ ...mockAboutEntry, title: 'Updated Title' });
      client.set.mockResolvedValue(true);

      const res = await request(app)
        .put('/about/1')
        .send({ title: 'Updated Title', descr: 'Updated Description' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'About entry updated successfully');
      expect(res.body.aboutEntry.title).toBe('Updated Title');
    });

    it('should return error for non-existing ID', async () => {
      About.findByPk.mockResolvedValue(null);

      const res = await request(app)
        .put('/about/999')
        .send({ title: 'Updated Title', descr: 'Updated Description' });

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errors');
    });
  });

  describe('DELETE /about/:id', () => {
    it('should delete an about entry successfully', async () => {
      About.findByPk.mockResolvedValue(mockAboutEntry);
      About.destroy = jest.fn().mockResolvedValue(true);
      client.del.mockResolvedValue(true);

      const res = await request(app).delete('/about/1');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('message', 'About entry deleted successfully');
    });

    it('should return error for non-existing ID', async () => {
      About.findByPk.mockResolvedValue(null);

      const res = await request(app).delete('/about/999');

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('errors');
    });
  });
});
