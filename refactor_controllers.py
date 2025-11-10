import re
import sys

def refactor_controller(content):
    """Remove try-catch blocks and wrap functions with asyncHandler"""
    
    # Pattern to match async function exports with try-catch
    pattern = r'(export const \w+ = async \(req: RequestWithTraceContext, res: Response\) => \{)\s*'
    pattern += r'((?:const \{ traceId, spanId \} = req;\s*)?)'
    pattern += r'try \{(.*?)\} catch \(error(?::\s*any)?\) \{.*?\}\s*\};'
    
    def replace_func(match):
        func_decl = match.group(1)
        trace_extract = match.group(2)
        body = match.group(3)
        
        # Remove the outer try block indentation (2 spaces)
        body_lines = body.split('\n')
        cleaned_lines = []
        for line in body_lines:
            if line.startswith('    '):
                cleaned_lines.append(line[4:])
            else:
                cleaned_lines.append(line)
        body = '\n'.join(cleaned_lines)
        
        # Wrap with asyncHandler
        new_func = func_decl.replace(
            'export const',
            'export const'
        ).replace(
            ' = async (',
            ' = asyncHandler(async ('
        )
        
        new_func += '\n'
        if trace_extract:
            new_func += trace_extract
        new_func += body.rstrip()
        new_func += '\n});'
        
        return new_func
    
    # Apply the transformation
    result = re.sub(pattern, replace_func, content, flags=re.DOTALL)
    
    return result

if __name__ == '__main__':
    file_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    if not file_path:
        print("Usage: python refactor_controllers.py <file_path>")
        sys.exit(1)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    refactored = refactor_controller(content)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(refactored)
    
    print(f"Refactored {file_path}")
