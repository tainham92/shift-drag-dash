-- Create shifts table
CREATE TABLE public.shifts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  day TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('regular', 'flexible', 'leave', 'week-off')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own shifts" 
ON public.shifts 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own shifts" 
ON public.shifts 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shifts" 
ON public.shifts 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shifts" 
ON public.shifts 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_shifts_updated_at
BEFORE UPDATE ON public.shifts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();