const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const sampleDoctors = [
  {
    name: "Dr. Sarah Johnson",
    email: "sarah.johnson@hospital.com",
    password: "doctor123",
    role: "doctor",
    specialization: "Cardiology",
    licenseNumber: "MD-CARD-2015-001",
    phone: "555-0101",
    availability: [
      { day: "Monday", slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] },
      { day: "Wednesday", slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] },
      { day: "Friday", slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] }
    ]
  },
  {
    name: "Dr. Michael Chen",
    email: "michael.chen@hospital.com",
    password: "doctor123",
    role: "doctor",
    specialization: "Endocrinology",
    licenseNumber: "MD-ENDO-2016-002",
    phone: "555-0102",
    availability: [
      { day: "Tuesday", slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] },
      { day: "Thursday", slots: ["09:00 AM", "10:00 AM", "11:00 AM", "02:00 PM", "03:00 PM"] }
    ]
  },
  {
    name: "Dr. Emily Rodriguez",
    email: "emily.rodriguez@hospital.com",
    password: "doctor123",
    role: "doctor",
    specialization: "General Medicine",
    licenseNumber: "MD-GEN-2017-003",
    phone: "555-0103",
    availability: [
      { day: "Monday", slots: ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "04:00 PM"] },
      { day: "Tuesday", slots: ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "04:00 PM"] },
      { day: "Wednesday", slots: ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "04:00 PM"] },
      { day: "Thursday", slots: ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "04:00 PM"] },
      { day: "Friday", slots: ["10:00 AM", "11:00 AM", "12:00 PM", "03:00 PM", "04:00 PM"] }
    ]
  },
  {
    name: "Dr. James Wilson",
    email: "james.wilson@hospital.com",
    password: "doctor123",
    role: "doctor",
    specialization: "Neurology",
    licenseNumber: "MD-NEUR-2018-004",
    phone: "555-0104",
    availability: [
      { day: "Monday", slots: ["09:00 AM", "11:00 AM", "02:00 PM"] },
      { day: "Wednesday", slots: ["09:00 AM", "11:00 AM", "02:00 PM"] },
      { day: "Friday", slots: ["09:00 AM", "11:00 AM", "02:00 PM"] }
    ]
  }
];

async function seedDoctors() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare');
    console.log('Connected to MongoDB');

    // Clear existing doctors
    await User.deleteMany({ role: 'doctor' });
    console.log('Cleared existing doctors');

    // Insert sample doctors
    for (const doctor of sampleDoctors) {
      const newDoctor = new User(doctor);
      await newDoctor.save();
      console.log(`✓ Created doctor: ${doctor.name}`);
    }

    console.log('\n✓ Successfully seeded doctors!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding doctors:', error);
    process.exit(1);
  }
}

seedDoctors();
