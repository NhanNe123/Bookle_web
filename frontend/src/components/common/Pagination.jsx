import React from 'react';

/**
 * Pagination Component
 * Reusable pagination component matching the HTML template structure
 * 
 * @param {Object} pagination - Pagination object with { page, pages, total }
 * @param {Function} onPageChange - Callback function when page changes, receives new page number
 */
const Pagination = ({ pagination, onPageChange }) => {
  // Don't render if there's only one page or less
  if (!pagination || pagination.pages <= 1) {
    return null;
  }

  const currentPage = pagination.page || 1;
  const totalPages = pagination.pages || 1;

  const handlePageClick = (e, pageNumber) => {
    e.preventDefault();
    if (onPageChange && pageNumber >= 1 && pageNumber <= totalPages) {
      onPageChange(pageNumber);
    }
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Maximum number of page buttons to show
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is less than maxVisible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages with ellipsis
      if (currentPage <= 3) {
        // Show first pages
        for (let i = 1; i <= 4; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        // Show last pages
        pages.push(1);
        pages.push('ellipsis');
        for (let i = totalPages - 3; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        // Show middle pages
        pages.push(1);
        pages.push('ellipsis');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pages.push(i);
        }
        pages.push('ellipsis');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <div className="page-nav-wrap text-center">
      <ul>
        {/* Previous Button */}
        <li>
          <a 
            className="previous" 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (canGoPrevious) {
                handlePageClick(e, currentPage - 1);
              }
            }}
            style={{ 
              pointerEvents: canGoPrevious ? 'auto' : 'none',
              opacity: canGoPrevious ? 1 : 0.5,
              cursor: canGoPrevious ? 'pointer' : 'not-allowed'
            }}
          >
            Trước
          </a>
        </li>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <li key={`ellipsis-${index}`}>
                <a className="page-numbers" href="#" onClick={(e) => e.preventDefault()}>
                  ...
                </a>
              </li>
            );
          }
          
          const isActive = page === currentPage;
          return (
            <li key={page}>
              <a 
                className={`page-numbers ${isActive ? 'active' : ''}`}
                href="#" 
                onClick={(e) => handlePageClick(e, page)}
                style={{
                  backgroundColor: isActive ? 'var(--theme)' : 'var(--bg)',
                  color: isActive ? 'var(--white)' : 'var(--header)',
                  borderColor: isActive ? 'var(--theme)' : 'var(--theme)'
                }}
              >
                {page}
              </a>
            </li>
          );
        })}

        {/* Next Button */}
        <li>
          <a 
            className="next" 
            href="#" 
            onClick={(e) => {
              e.preventDefault();
              if (canGoNext) {
                handlePageClick(e, currentPage + 1);
              }
            }}
            style={{ 
              pointerEvents: canGoNext ? 'auto' : 'none',
              opacity: canGoNext ? 1 : 0.5,
              cursor: canGoNext ? 'pointer' : 'not-allowed'
            }}
          >
            Sau
          </a>
        </li>
      </ul>
    </div>
  );
};

export default Pagination;

