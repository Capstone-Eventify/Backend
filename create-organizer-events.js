/**
 * Script to create 10 realistic events for organizer user
 * Run: node create-organizer-events.js
 */

require('dotenv').config();
const prisma = require('./src/lib/prisma');

const ORGANIZER_ID = '381665c4-707c-4fed-8b9b-91e0e3e09441';

// Calculate dates starting from tomorrow
const today = new Date();
today.setHours(0, 0, 0, 0);
const tomorrow = new Date(today);
tomorrow.setDate(tomorrow.getDate() + 1);

// Helper function to add days to a date
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

const events = [
  {
    title: 'Tech Innovation Summit 2025',
    description: 'Join us for a day of cutting-edge technology discussions, networking, and innovation showcases.',
    fullDescription: 'The Tech Innovation Summit brings together industry leaders, entrepreneurs, and tech enthusiasts for a comprehensive exploration of emerging technologies. Featuring keynote speakers, panel discussions, startup pitches, and networking opportunities. Topics include AI, blockchain, cloud computing, and cybersecurity.',
    category: 'Technology',
    eventType: 'Conference',
    daysFromToday: 1, // Tomorrow
    startTime: '09:00',
    endTime: '18:00',
    isOnline: false,
    venueName: 'Convention Center',
    address: '123 Tech Boulevard',
    city: 'San Francisco',
    state: 'CA',
    zipCode: '94102',
    country: 'USA',
    maxAttendees: 500,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&h=600&fit=crop'
    ],
    tags: ['Technology', 'Innovation', 'Networking', 'AI', 'Startups'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'Early Bird', price: 99, description: 'Early bird pricing', quantity: 100, available: 75 },
      { name: 'Regular', price: 149, description: 'Regular admission', quantity: 300, available: 250 },
      { name: 'VIP', price: 299, description: 'VIP access with lunch', quantity: 100, available: 80 }
    ]
  },
  {
    title: 'Digital Marketing Masterclass',
    description: 'Learn advanced digital marketing strategies from industry experts.',
    fullDescription: 'A comprehensive workshop covering SEO, social media marketing, content strategy, email campaigns, and analytics. Perfect for marketers looking to level up their skills. Includes hands-on exercises and real-world case studies.',
    category: 'Business',
    eventType: 'Workshop',
    daysFromToday: 3,
    startTime: '10:00',
    endTime: '16:00',
    isOnline: true,
    meetingLink: 'https://zoom.us/j/123456789',
    maxAttendees: 200,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop'
    ],
    tags: ['Marketing', 'Digital', 'Business', 'SEO', 'Social Media'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'Standard', price: 49, description: 'Full workshop access', quantity: 150, available: 120 },
      { name: 'Premium', price: 99, description: 'Includes recording and materials', quantity: 50, available: 35 }
    ]
  },
  {
    title: 'Yoga & Mindfulness Retreat',
    description: 'A peaceful day of yoga, meditation, and wellness activities.',
    fullDescription: 'Escape the hustle and reconnect with yourself. This retreat includes multiple yoga sessions for all levels, guided meditation, healthy meals, and wellness workshops. Set in a serene location perfect for relaxation and self-care.',
    category: 'Health & Wellness',
    eventType: 'Workshop',
    daysFromToday: 5,
    startTime: '08:00',
    endTime: '17:00',
    isOnline: false,
    venueName: 'Serenity Wellness Center',
    address: '456 Peaceful Lane',
    city: 'Los Angeles',
    state: 'CA',
    zipCode: '90028',
    country: 'USA',
    maxAttendees: 50,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=600&fit=crop'
    ],
    tags: ['Yoga', 'Wellness', 'Meditation', 'Health', 'Mindfulness'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'Full Day Pass', price: 89, description: 'All sessions and meals included', quantity: 50, available: 30 }
    ]
  },
  {
    title: 'Jazz Night at the Garden',
    description: 'An evening of smooth jazz performances in a beautiful garden setting.',
    fullDescription: 'Experience world-class jazz musicians performing under the stars. This intimate outdoor concert features a lineup of talented artists, delicious food and drinks, and a magical atmosphere. Perfect for a romantic evening or night out with friends.',
    category: 'Arts & Culture',
    eventType: 'Festival',
    daysFromToday: 7,
    startTime: '19:00',
    endTime: '23:00',
    isOnline: false,
    venueName: 'Botanical Gardens',
    address: '789 Garden Way',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    country: 'USA',
    maxAttendees: 300,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&h=600&fit=crop'
    ],
    tags: ['Jazz', 'Music', 'Live Performance', 'Outdoor', 'Entertainment'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'General Admission', price: 45, description: 'Standing room', quantity: 200, available: 150 },
      { name: 'VIP Seating', price: 95, description: 'Reserved seating near stage', quantity: 100, available: 70 }
    ]
  },
  {
    title: 'Startup Pitch Competition',
    description: 'Watch innovative startups pitch their ideas to investors and win prizes.',
    fullDescription: 'A competitive pitch event where 20 selected startups present their business ideas to a panel of investors and industry experts. Winners receive funding, mentorship opportunities, and exposure. Great networking event for entrepreneurs and investors.',
    category: 'Business',
    eventType: 'Competition',
    daysFromToday: 10,
    startTime: '13:00',
    endTime: '18:00',
    isOnline: false,
    venueName: 'Innovation Hub',
    address: '321 Startup Street',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    country: 'USA',
    maxAttendees: 250,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop'
    ],
    tags: ['Startups', 'Pitching', 'Investment', 'Entrepreneurship', 'Networking'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'Audience', price: 25, description: 'Watch the pitches', quantity: 200, available: 140 },
      { name: 'Investor', price: 199, description: 'Investor networking access', quantity: 50, available: 30 }
    ]
  },
  {
    title: 'Food & Wine Festival',
    description: 'A celebration of local cuisine, fine wines, and culinary excellence.',
    fullDescription: 'Indulge in a culinary journey featuring top local chefs, wine tastings, cooking demonstrations, and food vendors. Sample dishes from various cuisines, learn cooking techniques, and enjoy live entertainment. Perfect for food lovers!',
    category: 'Food & Drink',
    eventType: 'Festival',
    daysFromToday: 14,
    startTime: '12:00',
    endTime: '20:00',
    isOnline: false,
    venueName: 'City Park',
    address: '555 Culinary Avenue',
    city: 'Chicago',
    state: 'IL',
    zipCode: '60601',
    country: 'USA',
    maxAttendees: 1000,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&h=600&fit=crop'
    ],
    tags: ['Food', 'Wine', 'Culinary', 'Festival', 'Tasting'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'General Admission', price: 35, description: 'Food samples included', quantity: 700, available: 500 },
      { name: 'VIP', price: 125, description: 'Wine tasting + VIP area', quantity: 300, available: 200 }
    ]
  },
  {
    title: 'Web Development Bootcamp',
    description: 'Intensive 2-day bootcamp covering modern web development technologies.',
    fullDescription: 'Learn full-stack web development in this intensive bootcamp. Topics include HTML5, CSS3, JavaScript, React, Node.js, databases, and deployment. Hands-on coding exercises, real projects, and career guidance included. Suitable for beginners and intermediate developers.',
    category: 'Education',
    eventType: 'Training',
    daysFromToday: 18,
    isMultiDay: true,
    durationDays: 2,
    startTime: '09:00',
    endTime: '17:00',
    isOnline: true,
    meetingLink: 'https://zoom.us/j/987654321',
    maxAttendees: 100,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1498050108023-c5249f4f0856?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1498050108023-c5249f4f0856?w=800&h=600&fit=crop'
    ],
    tags: ['Web Development', 'Coding', 'Programming', 'Bootcamp', 'Education'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'Full Bootcamp', price: 299, description: '2-day intensive training', quantity: 100, available: 65 }
    ]
  },
  {
    title: 'Marathon & Fun Run',
    description: 'Join thousands of runners for our annual marathon and fun run event.',
    fullDescription: 'A community fitness event featuring a full marathon (26.2 miles), half marathon, 10K, and 5K fun run. Open to runners of all levels. Includes race packet, finisher medal, refreshments, and post-race celebration. Proceeds benefit local charities.',
    category: 'Sports',
    eventType: 'Competition',
    daysFromToday: 21,
    startTime: '07:00',
    endTime: '14:00',
    isOnline: false,
    venueName: 'Central Park',
    address: '1000 Running Trail',
    city: 'Boston',
    state: 'MA',
    zipCode: '02101',
    country: 'USA',
    maxAttendees: 5000,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1571008887538-b36bb32f4571?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&h=600&fit=crop'
    ],
    tags: ['Running', 'Marathon', 'Fitness', 'Sports', 'Charity'],
    status: 'LIVE',
    ticketTiers: [
      { name: '5K Fun Run', price: 35, description: '5K distance', quantity: 2000, available: 1500 },
      { name: '10K', price: 50, description: '10K distance', quantity: 1500, available: 1000 },
      { name: 'Half Marathon', price: 75, description: '13.1 miles', quantity: 1000, available: 700 },
      { name: 'Full Marathon', price: 100, description: '26.2 miles', quantity: 500, available: 350 }
    ]
  },
  {
    title: 'Photography Workshop: Landscape & Nature',
    description: 'Learn landscape and nature photography from professional photographers.',
    fullDescription: 'A hands-on photography workshop focusing on landscape and nature photography. Includes field trips to scenic locations, composition techniques, camera settings, post-processing tips, and portfolio review. Bring your camera!',
    category: 'Arts & Culture',
    eventType: 'Workshop',
    daysFromToday: 25,
    startTime: '08:00',
    endTime: '16:00',
    isOnline: false,
    venueName: 'Nature Reserve',
    address: '888 Scenic Drive',
    city: 'Seattle',
    state: 'WA',
    zipCode: '98101',
    country: 'USA',
    maxAttendees: 30,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=600&fit=crop'
    ],
    tags: ['Photography', 'Nature', 'Workshop', 'Arts', 'Landscape'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'Workshop Pass', price: 149, description: 'Full day workshop', quantity: 30, available: 20 }
    ]
  },
  {
    title: 'Networking Mixer: Tech Professionals',
    description: 'Connect with fellow tech professionals over drinks and appetizers.',
    fullDescription: 'An evening networking event for tech professionals. Meet developers, designers, product managers, and entrepreneurs. Includes drinks, appetizers, and structured networking activities. Great opportunity to expand your professional network.',
    category: 'Networking',
    eventType: 'Meetup',
    daysFromToday: 28,
    startTime: '18:00',
    endTime: '21:00',
    isOnline: false,
    venueName: 'Tech Lounge',
    address: '222 Innovation Drive',
    city: 'Denver',
    state: 'CO',
    zipCode: '80202',
    country: 'USA',
    maxAttendees: 150,
    price: 0,
    currency: 'USD',
    image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=800&h=600&fit=crop'
    ],
    tags: ['Networking', 'Tech', 'Professional', 'Meetup', 'Career'],
    status: 'LIVE',
    ticketTiers: [
      { name: 'General Admission', price: 20, description: 'Includes drinks and appetizers', quantity: 150, available: 100 }
    ]
  }
];

async function createEvents() {
  try {
    console.log('🎉 Creating 10 events for organizer...');
    console.log(`Organizer ID: ${ORGANIZER_ID}\n`);

    // Verify organizer exists
    const organizer = await prisma.user.findUnique({
      where: { id: ORGANIZER_ID }
    });

    if (!organizer) {
      console.error('❌ Organizer not found!');
      process.exit(1);
    }

    console.log(`✅ Found organizer: ${organizer.firstName} ${organizer.lastName} (${organizer.email})\n`);

    let createdCount = 0;

    for (const eventData of events) {
      try {
        const { ticketTiers, daysFromToday, isMultiDay, durationDays, startTime, endTime, ...eventFields } = eventData;

        // Calculate start and end dates dynamically
        const eventStartDate = addDays(tomorrow, daysFromToday || 0);
        const startDateTime = new Date(eventStartDate);
        const [startHour, startMinute] = startTime.split(':');
        startDateTime.setHours(parseInt(startHour), parseInt(startMinute), 0, 0);

        let endDateTime;
        if (isMultiDay && durationDays) {
          // Multi-day event: end date is start date + duration days
          endDateTime = addDays(eventStartDate, durationDays - 1);
          const [endHour, endMinute] = endTime.split(':');
          endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        } else {
          // Single day event: same day, different time
          endDateTime = new Date(startDateTime);
          const [endHour, endMinute] = endTime.split(':');
          endDateTime.setHours(parseInt(endHour), parseInt(endMinute), 0, 0);
        }

        const event = await prisma.$transaction(async (tx) => {
          const createdEvent = await tx.event.create({
            data: {
              ...eventFields,
              startDate: startDateTime,
              endDate: endDateTime,
              startTime: startTime,
              endTime: endTime,
              organizerId: ORGANIZER_ID,
              ticketTiers: ticketTiers && ticketTiers.length > 0 ? {
                create: ticketTiers.map(tier => ({
                  name: tier.name,
                  price: tier.price,
                  description: tier.description || '',
                  quantity: tier.quantity || 100,
                  available: tier.available !== undefined ? tier.available : tier.quantity || 100,
                  isActive: true
                }))
              } : undefined
            }
          });

          return createdEvent;
        });

        createdCount++;
        console.log(`✅ Created: ${event.title} (${event.id})`);
      } catch (error) {
        console.error(`❌ Failed to create "${eventData.title}":`, error.message);
      }
    }

    console.log(`\n🎊 Successfully created ${createdCount} out of ${events.length} events!`);

  } catch (error) {
    console.error('❌ Error creating events:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createEvents();

