==================================
Multiple Choice Questions
==================================

This page demonstrates the full range of options available in the mcq directive.

Basic MCQ
------------


.. mcq::
   :question: Which index type ensures unique values in a column?
   :shuffle:

   .. choice:: Primary key
      :correct:
      :explain: A primary key enforces uniqueness and non-null across rows.

   .. choice:: Full-text index
      :explain: Full-text indexes support text search; they do not enforce uniqueness.

   .. choice:: Unique index
      :correct:
      :explain: A unique index enforces unique values but allows a single NULL in many databases.

   .. choice:: Foreign key
      :explain: Foreign keys enforce referential integrity, not uniqueness of the referencing column.
