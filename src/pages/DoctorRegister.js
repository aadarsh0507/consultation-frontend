import React, { useState } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaIdCard, FaLock, FaEye, FaEyeSlash, FaUserMd } from 'react-icons/fa';
import { authAPI } from '../services/api';

const DoctorRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    doctorId: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const response = await authAPI.register({
        name: formData.name,
        doctorId: formData.doctorId,
        password: formData.password,
        role: 'doctor'
      });
      
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      navigate('/home');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'An error occurred during registration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Row className="justify-content-center">
            <Col md={6} lg={5}>
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <Card className="shadow-lg border-0" style={{ 
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  backdropFilter: 'blur(10px)'
                }}>
                  <Card.Body className="p-4">
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4, duration: 0.5 }}
                      className="text-center mb-4"
                    >
                      <div className="mb-3">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.6, duration: 0.5, type: "spring" }}
                        >
                          <FaUserMd size={50} className="text-primary" />
                        </motion.div>
                      </div>
                      <h3 className="mb-0">Doctor Registration</h3>
                      <p className="text-muted">Create your account to get started</p>
                    </motion.div>
                    
                    <AnimatePresence mode="wait">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                        >
                          <Alert variant="danger" className="mb-4">
                            {error}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Form onSubmit={handleSubmit}>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Name</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FaUser className="text-primary" />
                            </span>
                            <Form.Control
                              type="text"
                              name="name"
                              value={formData.name}
                              onChange={handleChange}
                              placeholder="Enter your name"
                              required
                              className="border-start-0"
                              style={{ height: '50px' }}
                            />
                          </div>
                        </Form.Group>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.7, duration: 0.5 }}
                      >
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Doctor ID</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FaIdCard className="text-primary" />
                            </span>
                            <Form.Control
                              type="text"
                              name="doctorId"
                              value={formData.doctorId}
                              onChange={handleChange}
                              placeholder="Enter your doctor ID"
                              required
                              className="border-start-0"
                              style={{ height: '50px' }}
                            />
                          </div>
                        </Form.Group>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.8, duration: 0.5 }}
                      >
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Password</Form.Label>
                          <InputGroup>
                            <span className="input-group-text bg-white border-end-0">
                              <FaLock className="text-primary" />
                            </span>
                            <Form.Control
                              type={showPassword ? "text" : "password"}
                              name="password"
                              value={formData.password}
                              onChange={handleChange}
                              placeholder="Enter your password"
                              required
                              className="border-start-0"
                              style={{ height: '50px' }}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={() => setShowPassword(!showPassword)}
                              className="border-start-0"
                              style={{ height: '50px' }}
                            >
                              {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                          </InputGroup>
                        </Form.Group>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                      >
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">Confirm Password</Form.Label>
                          <InputGroup>
                            <span className="input-group-text bg-white border-end-0">
                              <FaLock className="text-primary" />
                            </span>
                            <Form.Control
                              type={showConfirmPassword ? "text" : "password"}
                              name="confirmPassword"
                              value={formData.confirmPassword}
                              onChange={handleChange}
                              placeholder="Confirm your password"
                              required
                              className="border-start-0"
                              style={{ height: '50px' }}
                            />
                            <Button
                              variant="outline-secondary"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              className="border-start-0"
                              style={{ height: '50px' }}
                            >
                              {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                          </InputGroup>
                        </Form.Group>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                      >
                        <div className="d-grid gap-2">
                          <Button
                            variant="primary"
                            type="submit"
                            disabled={loading}
                            className="py-3"
                            style={{
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              border: 'none',
                              borderRadius: '10px',
                              fontSize: '1.1rem',
                              fontWeight: 'bold'
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {loading ? (
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                            ) : null}
                            {loading ? 'Registering...' : 'Register'}
                          </Button>
                        </div>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="text-center mt-4"
                      >
                        <p className="mb-0 text-muted">
                          Already have an account?{' '}
                          <Button
                            variant="link"
                            className="p-0 text-decoration-none"
                            onClick={() => navigate('/doctor-login')}
                            style={{ color: '#667eea' }}
                          >
                            Login here
                          </Button>
                        </p>
                      </motion.div>
                    </Form>
                  </Card.Body>
                </Card>
              </motion.div>
            </Col>
          </Row>
        </motion.div>
      </Container>
    </div>
  );
};

export default DoctorRegister; 