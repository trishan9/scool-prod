import { useState, useEffect, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod"
import moment from "moment";
import { CalendarIcon } from "@heroicons/react/24/outline";
import { useRecoilState } from "recoil";
import { v4 as uuidv4 } from 'uuid';
import { addDoc } from "firebase/firestore";

import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import OutlinedInput from '@mui/material/OutlinedInput';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';
import Chip from '@mui/material/Chip';

import { authState } from "@/states"
import { surveysRef } from "@/config/firebase";
import useSchoolData from '@/hooks/useSchoolData';

// -------------------------MUI CONFIGS AND FUNCTIONS-------------------------
const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(name, subjects, theme) {
  return {
    fontWeight:
      subjects.indexOf(name) === -1
        ? theme.typography.fontWeightRegular
        : theme.typography.fontWeightMedium,
  };
}
// -------------------------MUI CONFIGS AND FUNCTIONS-------------------------

// Zod Schema
const formSchema = z.object({
  surveyName: z.string().min(1, "Survey name can't be empty").min(3, "Survey name can't be less than 3 characters"),
  expiryDate: z.string().min(1, "Survey date can't be empty"),
  neverExpires: z.boolean()
})

const CreateSurvey = () => {
  const [isSurveyExpiring, setIsSurveyExpiring] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [authUser] = useRecoilState(authState)

  const { schoolData, isLoading } = useSchoolData();
  const navigate = useNavigate()
  const theme = useTheme();

  useEffect(() => {
    if (schoolData) {
      setSubjects(schoolData.subjects)
    }
  }, [schoolData])

  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    setSubjects(
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const handleClick = () => {
    setIsSurveyExpiring((prevState) => !prevState);
  };

  const {
    register,
    formState: { errors },
    handleSubmit,
    reset
  } = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      neverExpires: false,
      expiryDate: moment().format("YYYY-MM-DD")
    }
  });

  const handleCreateSurvey = (data) => {
    const surveyId = `${authUser.email.replace("@trs.com", "")}-${uuidv4().slice(0, 8)}`
    const uri = `/participate/${surveyId}`

    const payload = {
      name: data.surveyName,
      participants: [],
      subjects,
      surveyId,
      uri,
      user: {
        email: authUser.email,
        id: authUser.id
      },
      status: "ACTIVE"
    }
    data.neverExpires == true
      ? payload.expiry = "NEVER"
      : payload.expiry = data.expiryDate

    addDoc(surveysRef, payload).then(value => {
      navigate("/dashboard/surveys")
      reset()
      setIsSurveyExpiring(false)
    }).catch(err => {
      console.log(err)
    })
  }

  return (
    <div className="w-full">
      {isLoading && <p>Loading...</p>}

      {!isLoading && schoolData ?
        <Fragment>
          <p className="text-xl font-bold">Create Survey</p>

          <div className="bg-white rounded-xl shadow-sm h-[37rem] w-full p-6  my-6 flex flex-col relative">
            <form onSubmit={handleSubmit(handleCreateSurvey)} className="grid grid-cols-1 gap-8">
              <div className="flex flex-col gap-2">
                <label htmlFor="" className="font-semibold">
                  Survey Name
                </label>

                <p className="text-gray-600">What is the name of your Survey?</p>

                <input
                  type="text"
                  id="surveyName"
                  {...register("surveyName")}
                  className="border-gray-300 border-2 h-[45px] w-full rounded-md focus:border"
                />

                {errors.surveyName && (
                  <p className="text-sm text-error">{errors.surveyName.message}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="" className="font-semibold">
                  Expiry Date
                </label>

                <p className="text-gray-600">When does the Campaign End?</p>

                {isSurveyExpiring && (
                  <Fragment>
                    <label htmlFor="expiryDate" className="relative flex items-center justify-center">
                      <input
                        type="date"
                        id="expiryDate"
                        {...register("expiryDate")}
                        min={moment().format("YYYY-MM-DD")}
                        className="border-gray-300 border-2 h-[45px] w-full rounded-md focus:border relative overflow-hidden"
                      />

                      <CalendarIcon className="absolute right-0 w-5 mr-3" />
                    </label>

                    {errors.expiryDate && (
                      <p className="text-sm text-error">{errors.expiryDate.message}</p>
                    )}
                  </Fragment>
                )}

                <div className="flex items-center gap-2 mb-6">
                  <input {...register("neverExpires")} id="never-expire" type="checkbox" defaultChecked={true} onChange={handleClick} className="rounded text-accent_primary ring-0 outline-0 focus:ring-0" />

                  <label htmlFor="never-expire" className="font-medium"  >
                    This survey never expires
                  </label>
                </div>

                <div className="flex flex-col w-full gap-2 mb-6">
                  <label htmlFor="" className="font-semibold">
                    Included Subjects
                  </label>

                  <p className="text-gray-600">Which subjects should be included in this survey?</p>

                  <div>
                    <FormControl className="w-full" >
                      <InputLabel id="demo-multiple-chip-label">Subjects</InputLabel>

                      <Select
                        labelId="demo-multiple-chip-label"
                        id="demo-multiple-chip"
                        multiple
                        required
                        value={subjects}
                        onChange={handleChange}
                        input={<OutlinedInput id="select-multiple-chip" label="Chip" />}
                        renderValue={(selected) => (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {selected.map((value) => (
                              <Chip key={value} label={value} />
                            ))}
                          </Box>
                        )}
                        MenuProps={MenuProps}
                      >
                        {schoolData.subjects.map((subject) => (
                          <MenuItem
                            key={subject}
                            value={subject}
                            style={getStyles(subject, subjects, theme)}
                          >
                            {subject}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </div>
                </div>
              </div>

              <div className="absolute my-2 bottom-[1rem] right-5">
                <button
                  type="submit"
                  className="flex items-center gap-2 justify-center rounded-md bg-accent_primary px-10 py-2 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-[#1e2f49] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition ease-in-out mt-10"
                >
                  Create Survey
                </button>
              </div>
            </form>
          </div>
        </Fragment>
        : null}
    </div>
  );
};

export default CreateSurvey;
