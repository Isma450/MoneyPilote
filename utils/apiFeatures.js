class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    //1A) filter query : get all query params except page, sort, limit, fields
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    //1B) advanced filtering : convert query params (gt, gte, lt, lte) to mongoDB operators ($gt, $gte, $lt, $lte)
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);
    this.query = this.query.find(JSON.parse(queryStr));

    return this;
  }

  sort() {
    console.log(this.queryString.sort);
    // 2) SORTING
    if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      //default sorting
      this.query = this.query.sort('-createdAt');
    }
    return this;
  }

  limitFields() {
    // 3) FIELD LIMITING
    //limminting the search results to only the fields specified in the query string
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      //default limiting (exclude __v field using -)
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // 4) PAGINATION
    // page=2&limit=10, 1-10 page 1, 11-20 page 2, 21-30 page 3
    const page = +this.queryString.page || 1;
    const limit = +this.queryString.limit || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
