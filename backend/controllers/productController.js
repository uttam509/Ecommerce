const Product = require("../models/productModel");
const ErrorHander = require("../utils/errorhander");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const ApiFeature = require("../utils/apifeatures");
const cloudinary = require("cloudinary");
// Create Product -- Admin
// exports.createProduct = async (req, res, next) => {

//     const product = await Product.create(req.body);
//     res.status(201).json({
//         success: true,
//         product
//     })

// }
exports.createProduct = catchAsyncErrors(async (req, res, next) => {


    let images = [];

    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    const imagesLink = [];

    for (let i = 0; i < images.length; i++) {

        const result = await cloudinary.v2.uploader.upload(images[i], {
            folder: "products",
        });

        imagesLink.push({
            public_id: result.public_id,
            url: result.secure_url,
        })

    }

    req.body.images = imagesLink;
    req.body.user = req.user.id;

    const product = await Product.create(req.body);
    res.status(201).json({
        success: true,
        product
    })

})

// Get All Products

exports.getAllProduct = catchAsyncErrors(async (req, res, next) => {
    const resultPerPage = 8;
    const productsCount = await Product.countDocuments();
    const apifeature = new ApiFeature(Product.find(), req.query).search().filter();

    let products = await apifeature.query;

    let filteredProductsCount = products.length;

    apifeature.pagination(resultPerPage);

    products = await apifeature.query.clone();

    res.status(200).json({
        success: true,
        products,
        productsCount,
        resultPerPage,
        filteredProductsCount,
    })

})

// Get All Products {ADMIN}

exports.getAdminProducts = catchAsyncErrors(async (req, res, next) => {

    const products = await Product.find();


    res.status(200).json({
        success: true,
        products,
    })

})

// Get Single Product Details

exports.getProductDetails = catchAsyncErrors(async (req, res, next) => {

    let product = await Product.findById(req.params.id);

    // if (!product) {
    //     return res.status(500).json({
    //         success: false,
    //         message: 'Product not found.'
    //     })
    // }

    if (!product) {
        return next(new ErrorHander("Product not found.", 404));
    }
    res.status(200).json({
        success: true,
        product
    })

})



// Update Product - Admin

exports.updateProduct = catchAsyncErrors(async (req, res, next) => {

    let product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHander("Product not found.", 404));
    }

    // Images Start Here

    let images = [];

    if (typeof req.body.images === "string") {
        images.push(req.body.images);
    } else {
        images = req.body.images;
    }

    if (images !== undefined) {

        // Deleting imgeas from Cloudinary
        for (let i = 0; i < product.images.length; i++) {
            await cloudinary.v2.uploader.destroy(product.images[i].public_id)
        }

        const imagesLink = [];

        for (let i = 0; i < images.length; i++) {

            const result = await cloudinary.v2.uploader.upload(images[i], {
                folder: "products",
            });

            imagesLink.push({
                public_id: result.public_id,
                url: result.secure_url,
            })

        }
        req.body.images = imagesLink;
    }

    product = await Product.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json({
        success: true,
        product
    })
}
)


// Delete Product -- Admin
exports.deleteProduct = catchAsyncErrors(async (req, res, next) => {

    let product = await Product.findById(req.params.id);
    if (!product) {
        return next(new ErrorHander("Product not found.", 404));
    }

    // Deleting imgeas from Cloudinary

    for (let i = 0; i < product.images.length; i++) {
        await cloudinary.v2.uploader.destroy(product.images[i].public_id)
    }

    await product.remove();

    res.status(200).json({
        success: true,
        message: 'Product Delete Successfully'
    })

})

// Create New Review or Update the Review
exports.createProductReview = catchAsyncErrors(async (req, res, next) => {

    const { rating, comment, productId } = req.body;

    const review = {
        user: req.user._id,
        name: req.user.name,
        rating: Number(rating),
        comment,
    };

    const product = await Product.findById(productId);

    const isReviewed = product.reviews.find(rev => rev.user.toString() === req.user._id.toString())

    if (isReviewed) {

        product.reviews.forEach(rev => {
            if (rev.user.toString() === req.user._id.toString()) {
                rev.rating = rating;
                rev.comment = comment;
            }
        })

    } else {

        product.reviews.push(review);
        product.numOfReviews = product.reviews.length;

    }

    let avg = 0;
    product.reviews.forEach(rev => {
        avg += rev.rating;
    })

    product.ratings = avg / product.reviews.length;

    await product.save({ validateBeforeSave: false });

    res.status(200).json({
        success: true,
    })
})


// Get All Review of the Product

exports.getProductReviews = catchAsyncErrors(async (req, res, next) => {

    const product = await Product.findById(req.query.id);
    if (!product) {
        return next(new ErrorHander("Product not found.", 404));
    }

    res.status(200).json({
        success: true,
        reviews: product.reviews
    })


})

// Delete Review of the Product

exports.deleteReview = catchAsyncErrors(async (req, res, next) => {
    const product = await Product.findById(req.query.productId);
    if (!product) {
        return next(new ErrorHander("Product not found.", 404));
    }

    const reviews = product.reviews.filter(rev => rev._id.toString() !== req.query.id.toString());



    let avg = 0;
    reviews.forEach(rev => {
        avg += rev.rating;
    })

    let ratings = 0;

    if (reviews.length === 0) {
        ratings = 0;
    } else {
        ratings = avg / reviews.length;
    }

    const numOfReviews = reviews.length;
    await Product.findByIdAndUpdate(req.query.productId, {
        reviews,
        ratings,
        numOfReviews,
    }, {
        new: true,
        runValidator: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true,
    })

})

