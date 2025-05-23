import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Card, Row, Col, Alert, InputGroup } from 'react-bootstrap';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaLock, FaEye, FaEyeSlash, FaHospital } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const DoctorLogin = () => {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [formData, setFormData] = useState({
    doctorId: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [debugInfo, setDebugInfo] = useState('');

  // Redirect if user is already logged in
  useEffect(() => {
    if (user && !loading) {
      console.log('User already logged in, redirecting to home');
      navigate('/home', { replace: true });
    }
  }, [user, navigate, loading]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDebugInfo('');
    setLoading(true);

    try {
      console.log('Attempting login with:', formData);
      

      // Make login request
      const loggedInUser = await login(formData);
      console.log('Login successful, user:', loggedInUser);
      

      setSuccess('Login successful!');
      // Navigation will be handled by the useEffect when user state updates
    } catch (err) {
      console.error('Login error:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Login failed. Please check your credentials.';
      setError(errorMessage);
      setDebugInfo(`Error: ${errorMessage}\nFull error: ${JSON.stringify(err, null, 2)}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 d-flex align-items-center" style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={4}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
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
                    <FaHospital size={40} className="text-primary mb-3" />
                    <h3 className="mb-0">Welcome Back</h3>
                    <p className="text-muted">Sign in to continue</p>
                  </motion.div>

                  <AnimatePresence mode="sync">
                    {error && (
                      <motion.div
                        key="error"
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
                    {success && (
                      <motion.div
                        key="success"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Alert variant="success" className="mb-4">
                          {success}
                        </Alert>
                      </motion.div>
                    )}
                    {debugInfo && (
                      <motion.div
                        key="debug"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Alert variant="info" className="mb-4">
                          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                            {debugInfo}
                          </pre>
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
                        <Form.Label className="fw-bold">Doctor ID</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-white border-end-0">
                            <FaUser className="text-primary" />
                          </InputGroup.Text>
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
                        </InputGroup>
                      </Form.Group>
                    </motion.div>

                    <motion.div
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.7, duration: 0.5 }}
                    >
                      <Form.Group className="mb-4">
                        <Form.Label className="fw-bold">Password</Form.Label>
                        <InputGroup>
                          <InputGroup.Text className="bg-white border-end-0">
                            <FaLock className="text-primary" />
                          </InputGroup.Text>
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
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.9, duration: 0.5 }}
                    >
                      <div className="d-grid">
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
                        >
                          {loading && (
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                          )}
                          {loading ? 'Logging in...' : 'Login'}
                        </Button>
                      </div>
                    </motion.div>
                  </Form>
                </Card.Body>
              </Card>
            </motion.div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default DoctorLogin;
