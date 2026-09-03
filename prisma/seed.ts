const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Clean up existing data
  await prisma.facility.deleteMany()
  await prisma.user.deleteMany()

  // Create demo facilities for matching demonstration
  const facilities = [
    {
      name: 'Nashik Civil Hospital (Government District Hospital)',
      type: 'DISTRICT_HOSPITAL',
      publicPrivate: 'PUBLIC',
      address: 'Main Road, Nashik',
      district: 'Nashik',
      latitude: 20.0059,
      longitude: 73.7900,
      emergencyCare: true,
      traumaCare: true,
      icu: true,
      bloodBank: true,
      oxygen: true,
      surgery: true,
      availabilityStatus: 'AVAILABLE',
      operatingHours: '24/7'
    },
    {
      name: 'Trimbakeshwar Rural Hospital (PHC)',
      type: 'PHC',
      publicPrivate: 'PUBLIC',
      address: 'Trimbakeshwar',
      district: 'Nashik',
      latitude: 19.9388,
      longitude: 73.5284,
      emergencyCare: true,
      traumaCare: false,
      icu: false,
      bloodBank: false,
      oxygen: true,
      surgery: false,
      availabilityStatus: 'AVAILABLE',
      operatingHours: '24/7'
    },
    {
      name: 'Sanjeevani Private Hospital',
      type: 'PRIVATE',
      publicPrivate: 'PRIVATE',
      address: 'College Road, Nashik',
      district: 'Nashik',
      latitude: 20.0100,
      longitude: 73.7800,
      emergencyCare: true,
      traumaCare: true,
      icu: true,
      bloodBank: true,
      oxygen: true,
      surgery: true,
      availabilityStatus: 'UNAVAILABLE', // To show availability matching
      operatingHours: '24/7'
    },
    {
      name: 'City Care Clinic',
      type: 'CLINIC',
      publicPrivate: 'PRIVATE',
      address: 'Gangapur Road, Nashik',
      district: 'Nashik',
      latitude: 20.0150,
      longitude: 73.7700,
      emergencyCare: false,
      traumaCare: false,
      icu: false,
      bloodBank: false,
      oxygen: false,
      surgery: false,
      availabilityStatus: 'AVAILABLE',
      operatingHours: '09:00 - 21:00'
    }
  ]

  for (const f of facilities) {
    await prisma.facility.create({ data: f })
  }

  // Create a demo user (Patient)
  await prisma.user.create({
    data: {
      name: 'Ramesh Patil',
      role: 'PATIENT',
      phone: '9876543210',
    }
  })

  // Create an Admin user
  await prisma.user.create({
    data: {
      name: 'System Admin',
      role: 'ADMIN',
      phone: 'admin',
    }
  })

  console.log('Database seeded with Demo Facilities!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
