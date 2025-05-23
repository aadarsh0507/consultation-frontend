import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // ✅ FIXED
import { useAuth } from '../context/AuthContext';
import fixWebmDuration from 'webm-duration-fix';



import { Container, Row, Col, Card, Button, Form, Alert } from 'react-bootstrap';

// Framer Motion
import { motion, AnimatePresence } from 'framer-motion';

// React Icons
import { FaCog, FaFileAlt, FaSignOutAlt, FaUser, FaIdCard, FaUserNurse, FaUserMd, FaVideo, FaStop } from 'react-icons/fa';
import { consultationAPI, API_URL } from '../services/api';

const Home = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [formData, setFormData] = useState({
    patientName: '',
    uhidId: '',
    attenderName: '',
    icuConsultantName: '',
    doctorName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [showVideo, setShowVideo] = useState(false);
  const [showStorageSettings, setShowStorageSettings] = useState(false);
  const [storagePath, setStoragePath] = useState('');
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const [consultations, setConsultations] = useState([]);
  const [storageSettings, setStorageSettings] = useState({
    path: '',
    maxSize: 1024, // in MB
    allowedTypes: ['webm', 'mp4']
  });

  // Fetch storage path when component mounts
  useEffect(() => {
    const fetchStoragePath = async () => {
      try {
        const response = await axios.get(`${API_URL}/get-storage-path`);
        if (response.data && response.data.path) {
          setStoragePath(response.data.path);
        }
      } catch (error) {
        console.error('Error fetching storage path:', error);
      }
    };

    fetchStoragePath();
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current?.stream) {
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

const recordingSessionIdRef = useRef(null);

const startRecording = async () => {
  try {
    const requiredFields = ['patientName', 'uhidId', 'attenderName', 'icuConsultantName', 'doctorName'];
    const emptyFields = requiredFields.filter(field => !formData[field]);
    if (emptyFields.length > 0) {
      setError(`Please fill in all required fields: ${emptyFields.join(', ')}`);
      return;
    }

    setShowVideo(true);
    recordingSessionIdRef.current = `session_${Date.now()}`;

    // ✅ Use wide-angle config
const stream = await navigator.mediaDevices.getUserMedia({
  video: {
    width: { ideal: 1920 },
    height: { ideal: 1080 },
    aspectRatio: 16 / 9,
    facingMode: 'user'
  },
  audio: { echoCancellation: true, noiseSuppression: true }
});



    if (videoRef.current) {
      videoRef.current.srcObject = stream;
      await videoRef.current.play().catch(err => {
        console.error('Error playing video:', err);
        setError('Error initializing camera');
      });
    }

    mediaRecorderRef.current = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp9,opus',
      videoBitsPerSecond: 3500000 // increased for better clarity
    });

    chunksRef.current = [];

    mediaRecorderRef.current.ondataavailable = async (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);

        const formData = new FormData();
        formData.append('videoChunk', e.data);
        formData.append('sessionId', recordingSessionIdRef.current);

        try {
          await axios.post(`${API_URL}/upload-chunk`, formData);
        } catch (err) {
          console.error('Failed to upload chunk:', err);
        }
      }
    };

    mediaRecorderRef.current.start(1000);
    setIsRecording(true);
    setError('');
    setSuccess('Recording started...');

    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      setRecordingTime(elapsedTime);
    }, 1000);

  } catch (err) {
    console.error('Recording error:', err);
    setError(`Error starting recording: ${err.message}`);
    setIsRecording(false);
    setShowVideo(false);
    if (mediaRecorderRef.current?.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  }
};


const stopRecording = async () => {
  if (mediaRecorderRef.current && isRecording) {
    setLoading(true);
    setError('');

    try {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      clearInterval(timerRef.current);
      timerRef.current = null;
      startTimeRef.current = null;

      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

      await new Promise(resolve => {
        mediaRecorderRef.current.onstop = () => resolve();
      });

      if (chunksRef.current.length === 0) {
        throw new Error('No video data recorded');
      }

    const videoBlob = new Blob(chunksRef.current, { type: 'video/webm' });
const fixedBlob = await fixWebmDuration(videoBlob, recordingTime); // duration in seconds

const videoUrl = URL.createObjectURL(fixedBlob);
const fileName = `${formData.uhidId}_${formData.patientName}.webm`;

const downloadLink = document.createElement('a');
downloadLink.href = videoUrl;
downloadLink.download = fileName;
document.body.appendChild(downloadLink);
downloadLink.click();
document.body.removeChild(downloadLink);
URL.revokeObjectURL(videoUrl);

      // ✅ Send consultation data to backend
      const consultationData = {
        patientName: formData.patientName,
        uhidId: formData.uhidId,
        doctor: user.id,
        doctorName: formData.doctorName,
        attenderName: formData.attenderName,
        icuConsultantName: formData.icuConsultantName,
        date: new Date().toISOString(),
        recordingDuration: recordingTime,
        status: 'completed',
        videoFileName: fileName // this is just the local filename
      };

      const token = localStorage.getItem('token'); // or from context/store
      await axios.post(`${API_URL}/consultations`, consultationData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setSuccess('Consultation saved and video downloaded.');

      // ✅ Reset form
      setFormData({
        patientName: '',
        uhidId: '',
        attenderName: '',
        icuConsultantName: '',
        doctorName: ''
      });
      setShowVideo(false);
      setRecordingTime(0);
      chunksRef.current = [];

    } catch (err) {
      console.error('Error during recording stop:', err);
      setError(err.response?.data?.message || err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  }
};


    



  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleLogout = () => {
    logout();
    navigate('/doctor-login');
  };

  const handleStorageSettings = async () => {
    if (user?.role !== 'admin') return;
    
    try {
      const response = await axios.post(`${API_URL}/update-storage-path`, {
        newStoragePath: storagePath
      });
      
      if (response.data.success) {
        setSuccess('Storage path updated successfully');
        setShowStorageSettings(false);
      }
    } catch (err) {
      setError('Failed to update storage path');
    }
  };

  return (
    <div className="min-vh-100" style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
      <Container className="py-5">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Row className="justify-content-center">
            <Col md={8} lg={6}>
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
                    <div className="d-flex justify-content-between align-items-center mb-4">
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.4, duration: 0.5 }}
                      >
                        <h3 className="mb-0">New Consultation</h3>
                        <p className="text-muted">Record a new patient consultation</p>
                      </motion.div>
                      <motion.div
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className="d-flex gap-2"
                      >
                        {user?.role === 'admin' && (
                          <Button
                            variant="outline-primary"
                            onClick={() => setShowStorageSettings(!showStorageSettings)}
                            className="me-2"
                          >
                            <FaCog className="me-2" />
                            Storage Settings
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          onClick={() => navigate('/report')}
                          className="me-2"
                        >
                          <FaFileAlt className="me-2" />
                          Reports
                        </Button>
                        <Button
                          variant="outline-danger"
                          onClick={handleLogout}
                        >
                          <FaSignOutAlt className="me-2" />
                          Logout
                        </Button>
                      </motion.div>
                    </div>

                    {/* {showStorageSettings && user?.role === 'admin' && (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    className="mb-4 p-3 border rounded"
  >
    <h5>Storage Settings</h5>
    <Form.Group className="mb-3">
      <Form.Label>Current Storage Path</Form.Label>
      <Form.Control
        type="text"
        value={storagePath}
        onChange={(e) => setStoragePath(e.target.value)}
        placeholder="Enter storage path"
      />
      <Form.Text className="text-muted">
        Current path where videos are being stored
      </Form.Text>
    </Form.Group>
    <Button variant="primary" onClick={handleStorageSettings}>
      Update Path
    </Button>
  </motion.div>
)} */}


                    <AnimatePresence mode="sync">
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          key="error"
                        >
                          <Alert variant="danger" className="mb-4">
                            {error}
                          </Alert>
                        </motion.div>
                      )}
                      {success && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.3 }}
                          key="success"
                        >
                          <Alert variant="success" className="mb-4">
                            {success}
                          </Alert>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <Form>
                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                      >
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Patient Name</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FaUser className="text-primary" />
                            </span>
                            <Form.Control
                              type="text"
                              name="patientName"
                              value={formData.patientName}
                              onChange={handleChange}
                              placeholder="Enter patient name"
                              required
                              disabled={isRecording}
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
                          <Form.Label className="fw-bold">UHID</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FaIdCard className="text-primary" />
                            </span>
                            <Form.Control
                              type="text"
                              name="uhidId"
                              value={formData.uhidId}
                              onChange={handleChange}
                              placeholder="Enter UHID"
                              required
                              disabled={isRecording}
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
                          <Form.Label className="fw-bold">Attender Name</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FaUserNurse className="text-primary" />
                            </span>
                            <Form.Control
                              type="text"
                              name="attenderName"
                              value={formData.attenderName}
                              onChange={handleChange}
                              placeholder="Enter attender name"
                              required
                              disabled={isRecording}
                              className="border-start-0"
                              style={{ height: '50px' }}
                            />
                          </div>
                        </Form.Group>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.9, duration: 0.5 }}
                      >
                        <Form.Group className="mb-3">
                          <Form.Label className="fw-bold">Doctor Name</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FaUserMd className="text-primary" />
                            </span>
                            <Form.Control
                              type="text"
                              name="doctorName"
                              value={formData.doctorName}
                              onChange={handleChange}
                              placeholder="Enter doctor name"
                              required
                              disabled={isRecording}
                              className="border-start-0"
                              style={{ height: '50px' }}
                            />
                          </div>
                        </Form.Group>
                      </motion.div>

                      <motion.div
                        initial={{ x: -20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1, duration: 0.5 }}
                      >
                        <Form.Group className="mb-4">
                          <Form.Label className="fw-bold">ICU Consultant</Form.Label>
                          <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                              <FaUserMd className="text-primary" />
                            </span>
                            <Form.Control
                              type="text"
                              name="icuConsultantName"
                              value={formData.icuConsultantName}
                              onChange={handleChange}
                              placeholder="Enter ICU consultant name"
                              required
                              disabled={isRecording}
                              className="border-start-0"
                              style={{ height: '50px' }}
                            />
                          </div>
                        </Form.Group>
                      </motion.div>

                      <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.1, duration: 0.5 }}
                        className="mb-4"
                      >
                        <div className="d-flex justify-content-center gap-3">
                          {!isRecording ? (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="primary"
                                onClick={startRecording}
                                disabled={loading}
                                className="d-flex align-items-center"
                                style={{
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  border: 'none',
                                  padding: '12px 24px',
                                  borderRadius: '10px',
                                  fontSize: '1.1rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                <FaVideo className="me-2" />
                                Start Recording
                              </Button>
                            </motion.div>
                          ) : (
                            <motion.div
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <Button
                                variant="danger"
                                onClick={stopRecording}
                                disabled={loading}
                                className="d-flex align-items-center"
                                style={{
                                  padding: '12px 24px',
                                  borderRadius: '10px',
                                  fontSize: '1.1rem',
                                  fontWeight: 'bold'
                                }}
                              >
                                <FaStop className="me-2" />
                                Stop Recording ({formatTime(recordingTime)})
                              </Button>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {showVideo && (
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.3 }}
  style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 1050,
    backgroundColor: '#000',
    overflow: 'hidden'
  }}
>
  <video
  ref={videoRef}
  autoPlay
  muted
  playsInline
  style={{
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%) scaleX(-1)',
    width: '100%',
    height: 'auto',
    objectFit: 'cover',
    aspectRatio: '16 / 9' // modern browsers support this
  }}
/>



  {/* Recording Time Badge */}
  {isRecording && (
    <div className="position-absolute top-0 start-0 p-3">
      <div className="d-flex align-items-center bg-dark bg-opacity-50 px-3 py-2 rounded-pill">
        <div
          className="me-2"
          style={{
            width: '10px',
            height: '10px',
            backgroundColor: 'red',
            borderRadius: '50%',
            boxShadow: '0 0 8px red',
            animation: 'pulse 1.2s infinite'
          }}
        ></div>
        <span className="text-white fw-bold">{formatTime(recordingTime)}</span>
      </div>
    </div>
  )}

  {/* Stop Recording Button */}
  {isRecording && (
    <div className="position-absolute bottom-0 start-50 translate-middle-x mb-4">
      <Button
        variant="danger"
        onClick={stopRecording}
        className="d-flex align-items-center px-4 py-2 rounded-pill shadow"
        style={{ fontWeight: 'bold', fontSize: '1.1rem' }}
      >
        <FaStop className="me-2" />
        Stop Recording
      </Button>
    </div>
  )}
</motion.div>









                      )}
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

export default Home;