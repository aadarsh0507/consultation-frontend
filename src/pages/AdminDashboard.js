import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Modal, Alert, Spinner, Pagination } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaFilePdf, FaFileExcel, FaFilter, FaArrowLeft, FaPlay, FaEdit, FaTrash } from 'react-icons/fa';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { consultationAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Redirect if not admin
  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/home');
    }
  }, [user, navigate]);

  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    patientName: '',
    doctorName: '',
    uhidId: ''
  });
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    fetchConsultations();
  }, [currentPage, itemsPerPage, sortConfig, filters]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError('');
  
      const response = await consultationAPI.getAll({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction
      });

      if (response.success) {
        const consultations = response.data.consultations || [];
        const total = response.data.total || 0;
        setConsultations(consultations);
        setTotalItems(total);
      } else {
        setError('Failed to fetch consultations');
      }
    } catch (err) {
      setError('Failed to fetch consultations');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleSort = (field) => {
    setSortConfig((prevConfig) => ({
      field,
      direction: prevConfig.field === field && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setCurrentPage(1);
    fetchConsultations();
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.autoTable({
      head: [['Date', 'Patient Name', 'UHID', 'Doctor', 'Attender', 'ICU Consultant', 'Duration', 'Status']],
      body: consultations.map((item) => [
        new Date(item.date).toLocaleDateString(),
        item.patientName,
        item.uhidId,
        item.doctorName,
        item.attenderName,
        item.icuConsultantName,
        `${item.recordingDuration} seconds`,
        item.status
      ])
    });
    doc.save('consultation_report.pdf');
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(consultations.map((item) => ({
      Date: new Date(item.date).toLocaleDateString(),
      'Patient Name': item.patientName,
      UHID: item.uhidId,
      Doctor: item.doctorName,
      Attender: item.attenderName,
      'ICU Consultant': item.icuConsultantName,
      Duration: `${item.recordingDuration} seconds`,
      Status: item.status
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Consultations');
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(data, 'consultation_report.xlsx');
  };

  const handleVideoClick = (consultation) => {
    if (!consultation.videoFileName) {
      setError('No video available for this consultation');
      return;
    }

    const videoPath = `http://localhost:5000/api/videos/${consultation.videoFileName}`;
    setVideoUrl(videoPath);
    setCurrentVideo(consultation);
    setShowVideoModal(true);
  };

  const handleEdit = (consultation) => {
    // Implement edit functionality
    console.log('Edit consultation:', consultation);
  };

  const handleDelete = async (consultation) => {
    if (window.confirm('Are you sure you want to delete this consultation?')) {
      try {
        await consultationAPI.delete(consultation._id);
        fetchConsultations();
      } catch (err) {
        setError('Failed to delete consultation');
      }
    }
  };

  return (
    <Container className="py-5">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="shadow-lg border-0" style={{ borderRadius: '20px', background: 'rgba(255, 255, 255, 0.95)', backdropFilter: 'blur(10px)' }}>
          <Card.Body className="p-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <Button variant="link" onClick={() => navigate('/home')} className="text-decoration-none">
                <FaArrowLeft className="me-2" />
                Back to Home
              </Button>
              <div>
                <Button variant="outline-primary" className="me-2" onClick={exportToPDF} disabled={loading || consultations.length === 0}>
                  <FaFilePdf className="me-2" />
                  Export PDF
                </Button>
                <Button variant="outline-success" onClick={exportToExcel} disabled={loading || consultations.length === 0}>
                  <FaFileExcel className="me-2" />
                  Export Excel
                </Button>
              </div>
            </div>

            <h3 className="mb-4">Admin Dashboard - All Consultations</h3>

            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <Card className="mb-4">
              <Card.Body>
                <h5 className="mb-3">
                  <FaFilter className="me-2" />
                  Filters
                </h5>
                <Row>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date From</Form.Label>
                      <Form.Control type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
                    </Form.Group>
                  </Col>
                  <Col md={3}>
                    <Form.Group className="mb-3">
                      <Form.Label>Date To</Form.Label>
                      <Form.Control type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Patient Name</Form.Label>
                      <Form.Control type="text" name="patientName" value={filters.patientName} onChange={handleFilterChange} placeholder="Search patient" />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>Doctor Name</Form.Label>
                      <Form.Control type="text" name="doctorName" value={filters.doctorName} onChange={handleFilterChange} placeholder="Search doctor" />
                    </Form.Group>
                  </Col>
                  <Col md={2}>
                    <Form.Group className="mb-3">
                      <Form.Label>UHID</Form.Label>
                      <Form.Control type="text" name="uhidId" value={filters.uhidId} onChange={handleFilterChange} placeholder="Search UHID" />
                    </Form.Group>
                  </Col>
                </Row>
                <Button variant="primary" onClick={applyFilters} disabled={loading}>
                  Apply Filters
                </Button>
              </Card.Body>
            </Card>

            {loading ? (
              <div className="text-center py-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Loading consultations...</p>
              </div>
            ) : consultations.length === 0 ? (
              <Alert variant="info">
                No consultations found. Try adjusting your filters.
              </Alert>
            ) : (
              <div className="table-responsive">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Form.Select style={{ width: 'auto' }} value={itemsPerPage} onChange={handleItemsPerPageChange} className="me-2">
                    <option value="10">10 per page</option>
                    <option value="25">25 per page</option>
                    <option value="50">50 per page</option>
                    <option value="100">100 per page</option>
                  </Form.Select>
                  <Pagination>
                    <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                    {Array.from({ length: Math.ceil(totalItems / itemsPerPage) }).map((_, index) => (
                      <Pagination.Item key={index + 1} active={index + 1 === currentPage} onClick={() => handlePageChange(index + 1)}>
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === Math.ceil(totalItems / itemsPerPage)} />
                    <Pagination.Last onClick={() => handlePageChange(Math.ceil(totalItems / itemsPerPage))} disabled={currentPage === Math.ceil(totalItems / itemsPerPage)} />
                  </Pagination>
                </div>

                <Table striped hover className="align-middle">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>
                        Date {sortConfig.field === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('patientName')} style={{ cursor: 'pointer' }}>
                        Patient Name {sortConfig.field === 'patientName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('uhidId')} style={{ cursor: 'pointer' }}>
                        UHID {sortConfig.field === 'uhidId' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('doctorName')} style={{ cursor: 'pointer' }}>
                        Doctor {sortConfig.field === 'doctorName' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Attender</th>
                      <th>ICU Consultant</th>
                      <th onClick={() => handleSort('recordingDuration')} style={{ cursor: 'pointer' }}>
                        Duration {sortConfig.field === 'recordingDuration' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th onClick={() => handleSort('status')} style={{ cursor: 'pointer' }}>
                        Status {sortConfig.field === 'status' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                      </th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {consultations.map((consultation) => (
                      <tr key={consultation._id}>
                        <td>{new Date(consultation.date).toLocaleString()}</td>
                        <td>{consultation.patientName}</td>
                        <td>{consultation.uhidId}</td>
                        <td>{consultation.doctorName}</td>
                        <td>{consultation.attenderName}</td>
                        <td>{consultation.icuConsultantName}</td>
                        <td>{consultation.recordingDuration} seconds</td>
                        <td>
                          <span className={`badge bg-${consultation.status === 'completed' ? 'success' : 'warning'}`}>
                            {consultation.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <Button variant="link" className="p-0" onClick={() => handleVideoClick(consultation)} disabled={!consultation.videoFileName}>
                              <FaPlay className={consultation.videoFileName ? 'text-primary' : 'text-secondary'} />
                            </Button>
                            <Button variant="link" className="p-0" onClick={() => handleEdit(consultation)}>
                              <FaEdit className="text-warning" />
                            </Button>
                            <Button variant="link" className="p-0" onClick={() => handleDelete(consultation)}>
                              <FaTrash className="text-danger" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </motion.div>

      {/* Video Modal */}
      <Modal show={showVideoModal} onHide={() => setShowVideoModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Consultation Video</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentVideo && videoUrl && (
            <div>
              <h5>Video for {currentVideo.patientName}</h5>
              <video controls src={videoUrl} className="w-100" />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowVideoModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminDashboard;