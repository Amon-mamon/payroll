from rest_framwork.views import exception_handler

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    
    if response is not None:
        response.data = {
            "success": False,
            "errors": response.data
        }
        
    return response