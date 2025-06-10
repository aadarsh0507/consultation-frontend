import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Table, Modal, Alert, Spinner, Pagination } from 'react-bootstrap';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaFilePdf, FaFileExcel, FaFilter, FaArrowLeft, FaPlay } from 'react-icons/fa';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { consultationAPI, API_URL } from '../services/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const Report = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

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
  const [videoError, setVideoError] = useState('');
  const [currentVideoPath, setCurrentVideoPath] = useState('');

  useEffect(() => {
    fetchConsultations();
  }, [currentPage, itemsPerPage, sortConfig, filters]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      setError('');
  
      console.log('Fetching consultations with params:', {
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction
      });

      const response = await consultationAPI.getAll({
        ...filters,
        page: currentPage,
        limit: itemsPerPage,
        sortField: sortConfig.field,
        sortDirection: sortConfig.direction
      });

      console.log('Raw response:', response);

      if (response && response.data) {
        if (response.data.success) {
          const { consultations, total } = response.data.data;
          console.log('Consultations data:', consultations);
          console.log('Total items:', total);
          setConsultations(consultations || []);
          setTotalItems(total || 0);
        } else {
          console.error('API returned unsuccessful response:', response.data);
          setError(response.data.message || 'Failed to fetch consultations');
        }
      } else {
        console.error('Invalid response format:', response);
        setError('Invalid response format from server');
      }
    } catch (err) {
      console.error('Error fetching consultations:', err);
      setError(err.response?.data?.message || err.message || 'Failed to fetch consultations');
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
    setCurrentPage(1);  // Reset to first page when items per page change
  };

  const applyFilters = async () => {
    setCurrentPage(1);  // Reset to first page when applying filters
    fetchConsultations();
  };

  const exportToPDF = () => {
    try {
      if (consultations.length === 0) {
        alert('No data to export');
        return;
      }

      // Create new PDF document in A4 size
      const doc = new jsPDF('p', 'mm', 'a4');
      
      // Add title only
      doc.setFontSize(16);
      doc.text('Consultation Report', 105, 10, { align: 'center' });
      
      // Add table using autoTable
      autoTable(doc, {
        startY: 15,
        head: [['Date', 'Patient Name', 'UHID', 'Doctor', 'Attender', 'ICU Consultant', 'Duration', 'Status']],
        body: consultations.map((item) => [
          new Date(item.date).toLocaleDateString(),
          item.patientName || '-',
          item.uhidId || '-',
          item.doctorName || '-',
          item.attenderName || '-',
          item.icuConsultantName || '-',
          `${item.recordingDuration || 0} seconds`,
          item.status || '-'
        ]),
        theme: 'grid',
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontStyle: 'bold',
          halign: 'center',
          valign: 'middle',
          fontSize: 9,
          cellPadding: 2
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        },
        margin: { left: 3, right: 3, top: 15 },
        styles: {
          fontSize: 8,
          cellPadding: 1,
          overflow: 'linebreak',
          halign: 'center',
          valign: 'middle',
          lineWidth: 0.1
        },
        columnStyles: {
          0: { cellWidth: 20 }, // Date
          1: { cellWidth: 30 }, // Patient Name
          2: { cellWidth: 20 }, // UHID
          3: { cellWidth: 25 }, // Doctor
          4: { cellWidth: 25 }, // Attender
          5: { cellWidth: 25 }, // ICU Consultant
          6: { cellWidth: 20 }, // Duration
          7: { cellWidth: 20 }  // Status
        },
        tableWidth: 'wrap',
        horizontalPageBreak: false,
        showHead: 'firstPage',
        didDrawPage: function(data) {
          // Header
          doc.setFontSize(8);
          doc.text('Page ' + doc.internal.getNumberOfPages(), data.settings.margin.left, 8);
        }
      });

      // Save the PDF
      doc.save('consultation_report.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    }
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

  // Function to check if video exists
// Function to check if the Cloudinary video exists
const checkVideoExists = async (videoUrl) => {
  try {
    const response = await axios({
      method: 'head',
      url: videoUrl,
      validateStatus: (status) => status < 500 // prevent throwing for 404/400
    });

    console.log('HEAD check status:', response.status);
    return response.status === 200;
  } catch (error) {
    console.error('Error checking video:', error);
    return false;
  }
};

// Function to handle clicking on a consultation and loading the video
const handleVideoClick = async (consultation) => {
  try {
    setVideoError('');
    setCurrentVideoPath('');

    if (!consultation.videoFileName) {
      setVideoError('No video file associated with this consultation');
      setShowVideoModal(true);
      return;
    }

    // Determine full video URL (Cloudinary)
    let videoUrl = consultation.videoFileName;
    if (!videoUrl.startsWith('http')) {
      videoUrl = `https://res.cloudinary.com/dxobt9i0k/video/upload/${videoUrl}`;
    }

    console.log('Checking video URL:', videoUrl);

    // Optional: Check if the video exists before playback
    const videoExists = await checkVideoExists(videoUrl);
    if (!videoExists) {
      setVideoError('Video file not found on Cloudinary');
      setShowVideoModal(true);
      return;
    }

    // Set the video path and show modal
    setCurrentVideoPath(videoUrl);
    setShowVideoModal(true);
  } catch (error) {
    console.error('Error playing video:', error);
    setVideoError('Error accessing video file');
    setShowVideoModal(true);
  }
};



  return (
    <div className="min-vh-100" style={{
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
    }}>
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

              <h3 className="mb-4">Consultation Reports</h3>

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
  Date & Time {sortConfig.field === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
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
                      
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>
        </motion.div>

       
      
      </Container>
    </div>
  );
};

export default Report;
