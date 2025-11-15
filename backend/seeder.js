require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Product = require('./models/Product');
const Table = require('./models/Table');
const Promotion = require('./models/Promotion');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coffee-system', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const seedData = async () => {
    try {
        // Clear existing data
        await User.deleteMany({});
        await Product.deleteMany({});
        await Table.deleteMany({});
        await Promotion.deleteMany({});
        
        console.log('Cleared existing data');

        // Create admin user
        const admin = await User.create({
            username: 'admin',
            email: 'admin@coffee.com',
            password: 'admin123',
            role: 'admin',
            firstName: 'Admin',
            lastName: 'User',
            phone: '0123456789'
        });

        // Create staff user
        const staff = await User.create({
            username: 'staff',
            email: 'staff@coffee.com',
            password: 'staff123',
            role: 'staff',
            firstName: 'Staff',
            lastName: 'User',
            phone: '0987654321'
        });

        // Create customer user
        const customer = await User.create({
            username: 'customer',
            email: 'customer@coffee.com',
            password: 'customer123',
            role: 'customer',
            firstName: 'John',
            lastName: 'Doe',
            phone: '0555555555'
        });

        console.log('Created users');

        // Create products
        const products = await Product.insertMany([
            // Coffee
            {
                name: 'Espresso',
                description: 'Rich and bold espresso shot',
                price: 35000,
                category: 'coffee',
                image: 'espresso.jpg',
                stock: 100,
                available: true
            },
            {
                name: 'Americano',
                description: 'Espresso with hot water',
                price: 40000,
                category: 'coffee',
                image: 'americano.jpg',
                stock: 100,
                available: true
            },
            {
                name: 'Cappuccino',
                description: 'Espresso with steamed milk and foam',
                price: 45000,
                category: 'coffee',
                image: 'cappuccino.jpg',
                stock: 100,
                available: true
            },
            {
                name: 'Latte',
                description: 'Espresso with steamed milk',
                price: 45000,
                category: 'coffee',
                image: 'latte.jpg',
                stock: 100,
                available: true
            },
            {
                name: 'Mocha',
                description: 'Espresso with chocolate and steamed milk',
                price: 50000,
                category: 'coffee',
                image: 'mocha.jpg',
                stock: 100,
                available: true
            },
            {
                name: 'Caramel Macchiato',
                description: 'Vanilla latte with caramel drizzle',
                price: 55000,
                category: 'coffee',
                image: 'caramel-macchiato.jpg',
                stock: 100,
                available: true
            },
            // Tea
            {
                name: 'Green Tea',
                description: 'Fresh green tea',
                price: 30000,
                category: 'tea',
                image: 'green-tea.jpg',
                stock: 80,
                available: true
            },
            {
                name: 'Milk Tea',
                description: 'Classic milk tea',
                price: 35000,
                category: 'tea',
                image: 'milk-tea.jpg',
                stock: 80,
                available: true
            },
            {
                name: 'Matcha Latte',
                description: 'Japanese green tea latte',
                price: 50000,
                category: 'tea',
                image: 'matcha-latte.jpg',
                stock: 60,
                available: true
            },
            // Smoothies
            {
                name: 'Strawberry Smoothie',
                description: 'Fresh strawberry smoothie',
                price: 45000,
                category: 'smoothie',
                image: 'strawberry-smoothie.jpg',
                stock: 50,
                available: true
            },
            {
                name: 'Mango Smoothie',
                description: 'Tropical mango smoothie',
                price: 45000,
                category: 'smoothie',
                image: 'mango-smoothie.jpg',
                stock: 50,
                available: true
            },
            {
                name: 'Avocado Smoothie',
                description: 'Creamy avocado smoothie',
                price: 50000,
                category: 'smoothie',
                image: 'avocado-smoothie.jpg',
                stock: 40,
                available: true
            },
            // Pastries
            {
                name: 'Croissant',
                description: 'Buttery French croissant',
                price: 30000,
                category: 'pastry',
                image: 'croissant.jpg',
                stock: 30,
                available: true
            },
            {
                name: 'Chocolate Muffin',
                description: 'Rich chocolate muffin',
                price: 35000,
                category: 'pastry',
                image: 'chocolate-muffin.jpg',
                stock: 25,
                available: true
            },
            {
                name: 'Blueberry Cake',
                description: 'Fresh blueberry cake slice',
                price: 40000,
                category: 'pastry',
                image: 'blueberry-cake.jpg',
                stock: 20,
                available: true
            },
            {
                name: 'Tiramisu',
                description: 'Classic Italian tiramisu',
                price: 55000,
                category: 'pastry',
                image: 'tiramisu.jpg',
                stock: 15,
                available: true
            }
        ]);

        console.log('Created products');

        // Create tables
        const tableImages = {
            indoor: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800',
            outdoor: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800',
            private: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=800'
        };
        
        const tables = [];
        for (let i = 1; i <= 20; i++) {
            let location = 'indoor';
            if (i >= 16) location = 'private'; // Bàn 16-20: phòng riêng
            else if (i >= 11) location = 'outdoor'; // Bàn 11-15: ngoài trời
            
            tables.push({
                number: i,
                capacity: i <= 5 ? 2 : i <= 15 ? 4 : 6,
                status: 'available',
                location: location,
                image: tableImages[location],
                description: location === 'private' ? 'Phòng riêng VIP' : 
                            location === 'outdoor' ? 'Khu vực ngoài trời' : 
                            'Khu vực trong nhà'
            });
        }
        await Table.insertMany(tables);

        console.log('Created tables');

        // Create promotions
        const now = new Date();
        const futureDate = new Date();
        futureDate.setMonth(futureDate.getMonth() + 3);

        await Promotion.insertMany([
            {
                title: 'Welcome Discount',
                description: '10% off on your first order',
                discountType: 'percentage',
                discountValue: 10,
                code: 'WELCOME10',
                minOrderValue: 0,
                maxDiscount: 50000,
                startDate: now,
                endDate: futureDate,
                isActive: true,
                usageLimit: 1000
            },
            {
                title: 'Summer Sale',
                description: '20% off all smoothies',
                discountType: 'percentage',
                discountValue: 20,
                code: 'SUMMER20',
                applicableProducts: products.filter(p => p.category === 'smoothie').map(p => p._id),
                minOrderValue: 50000,
                maxDiscount: 30000,
                startDate: now,
                endDate: futureDate,
                isActive: true,
                usageLimit: 500
            },
            {
                title: 'Coffee Lover',
                description: '15% off all coffee drinks',
                discountType: 'percentage',
                discountValue: 15,
                code: 'COFFEE15',
                applicableProducts: products.filter(p => p.category === 'coffee').map(p => p._id),
                minOrderValue: 40000,
                maxDiscount: 25000,
                startDate: now,
                endDate: futureDate,
                isActive: true,
                usageLimit: 300
            },
            {
                title: 'Big Order Discount',
                description: '50,000 VND off on orders above 200,000 VND',
                discountType: 'fixed',
                discountValue: 50000,
                code: 'BIG50',
                minOrderValue: 200000,
                startDate: now,
                endDate: futureDate,
                isActive: true,
                usageLimit: 200
            }
        ]);

        console.log('Created promotions');

        console.log('\n✅ Seed data created successfully!');
        console.log('\n📝 Default Users:');
        console.log('Admin: admin@coffee.com / admin123');
        console.log('Staff: staff@coffee.com / staff123');
        console.log('Customer: customer@coffee.com / customer123');
        console.log('\n🎫 Promotion Codes:');
        console.log('WELCOME10 - 10% off first order');
        console.log('SUMMER20 - 20% off smoothies');
        console.log('COFFEE15 - 15% off coffee drinks');
        console.log('BIG50 - 50,000 VND off orders above 200,000 VND');

    } catch (error) {
        console.error('Error seeding data:', error);
    } finally {
        mongoose.connection.close();
        console.log('\nDatabase connection closed');
    }
};

// Run seeder
connectDB().then(() => {
    seedData();
});
