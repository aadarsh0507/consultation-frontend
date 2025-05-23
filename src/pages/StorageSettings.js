
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import { Container, Card, Form, Button, Alert } from 'react-bootstrap';

// const StorageSettings = () => {
//   const [newStoragePath, setNewStoragePath] = useState('');
//   const [currentStoragePath, setCurrentStoragePath] = useState('');
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [videoFile, setVideoFile] = useState(null);
//   const [uploadError, setUploadError] = useState('');
//   const [uploadSuccess, setUploadSuccess] = useState('');

//   // Fetch the current storage path when the component loads
//   useEffect(() => {
//     const fetchStoragePath = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/get-storage-path');
//         setCurrentStoragePath(response.data.path);
//       } catch (err) {
//         setError('Failed to fetch current storage path.');
//       }
//     };
//     fetchStoragePath();
//   }, []);

//   // Handle storage path change
//   const handleStoragePathChange = async (e) => {
//     e.preventDefault();
//     try {
//       const response = await axios.post('http://localhost:5000/api/update-storage-path', {
//         newStoragePath: newStoragePath
//       });

//       setSuccessMessage(response.data.message);
//       setError('');
//       setCurrentStoragePath(newStoragePath);  // Update the current path displayed
//       setNewStoragePath('');
//     } catch (err) {
//       setError(err.response.data.error || 'Something went wrong!');
//       setSuccessMessage('');
//     }
//   };

//   // Handle file change for video upload
//   const handleFileChange = (e) => {
//     setVideoFile(e.target.files[0]);
//     setUploadError('');
//     setUploadSuccess('');
//   };

//   const handleVideoUpload = async () => {
//     if (!videoFile) {
//       setUploadError('Please select a video file to upload.');
//       return;
//     }
  
//     const formData = new FormData();
//     formData.append('videoFile', videoFile);
  
//     try {
//       const response = await axios.post('http://localhost:5000/api/save-video', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' }
//       });
  
//       setUploadSuccess('Video uploaded successfully!');
//       setUploadError('');
//       setVideoFile(null);
//     } catch (err) {
//       setUploadError(err.response.data.error || 'Video upload failed!');
//       setUploadSuccess('');
//     }
//   };
  

//   return (
//     <Container className="my-5">
//       <Card>
//         <Card.Body>
//           <Card.Title as="h2" className="mb-4 text-center">Storage Settings</Card.Title>

//           {/* Current Storage Path */}
//           <p><strong>Current Storage Path:</strong> {currentStoragePath}</p>

//           {/* Storage Path Update Form */}
//           <Form onSubmit={handleStoragePathChange}>
//             <Form.Group controlId="formStoragePath" className="mb-4">
//               <Form.Label>New Storage Path</Form.Label>
//               <Form.Control
//                 type="text"
//                 placeholder="Enter new storage path"
//                 value={newStoragePath}
//                 onChange={(e) => setNewStoragePath(e.target.value)}
//                 required
//               />
//             </Form.Group>

//             <Button variant="primary" type="submit" className="w-100">Update Path</Button>
//           </Form>

//           {/* Success/Failure Message for Path Update */}
//           {successMessage && <Alert variant="success" className="mt-4">{successMessage}</Alert>}
//           {error && <Alert variant="danger" className="mt-4">{error}</Alert>}

//           {/* Video Upload Section */}
//           <Card.Title as="h4" className="mt-5">Upload Video</Card.Title>
//           <Form>
//             <Form.Group controlId="formVideoUpload" className="mb-4">
//               <Form.Label>Select Video File</Form.Label>
//               <Form.Control
//                 type="file"
//                 accept="video/*"
//                 onChange={handleFileChange}
//               />
//             </Form.Group>
//             <Button variant="success" onClick={handleVideoUpload}>Upload Video</Button>
//           </Form>

//           {/* Success/Failure Message for Video Upload */}
//           {uploadSuccess && <Alert variant="success" className="mt-4">{uploadSuccess}</Alert>}
//           {uploadError && <Alert variant="danger" className="mt-4">{uploadError}</Alert>}
//         </Card.Body>
//       </Card>
//     </Container>
//   );
// };

// export default StorageSettings;



